# Story 2.4: Edit Client

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit any field of an existing client,
so that the client information stays up to date.

## Acceptance Criteria

1. **Given** the user is viewing a valid `ClienteDetailView` at `/clientes/$clienteId` (Story 2.2), **When** the right panel renders the `<section data-testid="cliente-detail-panel">`, **Then** a primary button labelled `"Editar"` (`<button data-testid="btn-editar-cliente">`) is visible at the TOP of the detail panel, ABOVE the `<dl>` field list. The button uses the brand primary color `#0e79fd` (background) + white text + `font-semibold`, is keyboard-focusable, and has `aria-label="Editar cliente"`. The button is HIDDEN when the panel is in `isLoading`, `isError`, or `cliente-not-found` states (only renders when `data` is a valid `Cliente`). (FR6, AC-E2.3)

2. **Given** the user clicks `"Editar"`, **When** the click handler fires, **Then** the SAME `<ClienteForm>` component from Story 2.3 opens as a centered modal — `<div role="dialog" aria-modal="true" data-testid="cliente-form-dialog">` — but with title `<h2>Editar cliente</h2>` (NOT `"Nuevo cliente"`) and all four inputs **pre-filled** with the current cliente values (`nombre`, `nit`, `telefono`, `ciudad`). The footer keeps two buttons: `[Cancelar]` (outline, left) and `[Guardar]` (primary, right). The modal traps focus, closes on `Esc`, on click outside, and on the `✕` icon. `autoFocus` lands on the `Nombre` input with its cursor at the end of the existing value. (FR6, AC-E2.3)

3. **Given** the form is pre-filled with the current cliente values, **When** the user modifies one or more fields and clicks `Guardar`, **Then** the frontend issues `PUT /api/v1/clientes/{id}` (where `{id}` is the routed `clienteId`) with JSON body `{ "nombre": "...", "nit": "...", "telefono": "...", "ciudad": "..." }`, receives `HTTP 200 OK` + the updated `ClienteDto`, invalidates BOTH the `['clientes']` AND `['clientes', id]` TanStack Query keys, closes the modal, and renders a success toast with Spanish copy `"Cliente actualizado correctamente"` (3s duration, `green-500` accent). The detail panel reflects the new values immediately, and the list panel item reflects the updated `nombre` and `nit` immediately without a manual reload (FR27 — automatic propagation via cache invalidation). (FR6, FR27, AC-E2.3, NFR2)

4. **Given** the edit modal is open with pre-filled values, **When** the user CLEARS a required field (or replaces it with whitespace) and clicks `Guardar`, **Then** Zod + React Hook Form trigger inline validation: the offending field's input gets `border-red-500` + `aria-invalid="true"`, and an error message `<p data-testid="cliente-form-error-{field}">Este campo es requerido</p>` appears DIRECTLY BELOW the input in `text-sm text-red-600`. NO `PUT /api/v1/clientes/{id}` request is fired (assert via MSW `unhandledRequest: 'error'`). Focus jumps to the FIRST invalid field. (FR8, AC-E2.4)

5. **Given** the form has triggered an inline error on a specific field, **When** the user types a valid value in that field, **Then** the error message clears on the next valid `onChange` (re-validation mode `onChange` after first error per the UX spec §Form Validation). The `Guardar` button stays enabled — submission re-runs the full Zod schema. (FR8, AC-E2.4)

6. **Given** the user clicks `Cancelar` (or `Esc`, or the `✕` close icon, or the overlay), **When** the modal closes, **Then** the form state is discarded entirely (NO `PUT` request fired, NO local mutation applied), the modal unmounts, and the detail panel CONTINUES to show the ORIGINAL cliente data unchanged (the same values it had before the modal opened). The button that opened the modal (`btn-editar-cliente`) regains keyboard focus. (UX spec §Modal & Overlay Patterns, R-006 mitigation)

7. **Given** the user submits the form with a `nit` that ALREADY belongs to a DIFFERENT cliente in the database (i.e. the NIT was changed to one that collides), **When** the backend's `IClienteRepository.ExistsByNitAsync` (excluding the current `{id}`) returns `true` (or — defensively — the unique index `uk_clientes_nit` rejects the update), **Then** the backend returns `HTTP 409 Conflict` with a `Content-Type: application/problem+json` body matching `{ status: 409, title: "El NIT/RUC ya está registrado.", type: "https://tools.ietf.org/html/rfc7231#section-6.5.8", instance: "/api/v1/clientes/{id}" }`. NO `stackTrace`, `detail` with internal info, or exception class name is exposed (NFR6). The frontend translates the 409 to an inline error on the `nit` field with Spanish copy `"El NIT/RUC ya está registrado"` (matches the AC-required phrasing from Story 2.3). NO red toast fires (the 409 is a domain conflict surfaced inline). The modal STAYS OPEN so the user can correct the NIT without re-typing the other fields. (FR8, NFR6, R-003)

8. **Given** the user submits an UNCHANGED `nit` value (same NIT as the cliente being edited), **When** the backend processes the update, **Then** the backend MUST NOT raise a 409 — the uniqueness check excludes the current cliente's own row by `id`. The update proceeds normally and returns `HTTP 200 OK + ClienteDto`. (Avoids the "edit-without-changing-NIT throws 409" footgun.)

9. **Given** the user submits the form, **When** the backend returns ANY 5xx error OR the request fails at the network layer (NOT 409, NOT 400), **Then** a red toast appears with Spanish copy `"No se pudo guardar. Intenta de nuevo."` (5s duration). The modal STAYS OPEN with the current form values intact so the user can re-submit. The toast must NOT leak the raw error message or stack trace (NFR6).

10. **Given** the user submits an oversize or syntactically invalid payload (e.g. `nombre` longer than 200 chars, `nit` longer than 50 chars, `ciudad` longer than 100 chars), **When** FluentValidation runs on the backend's `UpdateClienteCommandValidator`, **Then** the API returns `HTTP 400 Bad Request` with `Content-Type: application/problem+json` and a body containing `errors` keyed by field name (RFC 7807 §`errors` extension). The frontend maps each `errors.{field}` entry back to the corresponding inline error in the form. NO stack trace leaks (NFR6). (NFR5, NFR6)

11. **Given** the user submits an edit for a cliente whose `id` does NOT exist in the database (e.g. it was deleted in another tab), **When** the backend's repository lookup returns `null`, **Then** the API returns `HTTP 404 Not Found` with a Problem Details body `{ status: 404, title: "Cliente no encontrado.", type: "https://tools.ietf.org/html/rfc7231#section-6.5.4", instance: "/api/v1/clientes/{id}" }`. The frontend handles this by closing the modal and surfacing the red toast `"No se pudo guardar. Intenta de nuevo."` (5s) — same path as a 5xx error from the user's perspective. NO partial UI update occurs.

12. **Given** the backend exposes `PUT /api/v1/clientes/{id:guid}` per architecture.md §API & Communication Patterns (line 253) and §API response shapes (line 376: `PUT → 200 OK + updated object`), **When** the endpoint is invoked with a valid body and an existing `id`, **Then** it returns `HTTP 200 OK` with the updated `ClienteDto` in the response body (direct object, no wrapper, camelCase shape: `{ id, nombre, nit, telefono, ciudad, createdAt, updatedAt }`). `createdAt` is preserved from the original record; `updatedAt` is bumped to `DateTimeOffset.UtcNow` by `ClienteEntity.Update()`. (FR6, NFR2, architecture.md §API response shapes)

13. **Given** the backend integration test project, **When** `dotnet test` runs, **Then** the following tests pass (added to a new `backend/tests/SiesaAgents.IntegrationTests/ClientesUpdateEndpointTests.cs` file):
    - `UpdateCliente_WithValidPayload_Returns200WithUpdatedClienteDto` — seed a cliente, PUT a valid body with modified `nombre` + `ciudad`, assert 200 + body shape (`id` unchanged, `nombre` + `ciudad` reflect new values, `nit` + `telefono` unchanged, `createdAt` preserved, `updatedAt` strictly greater than the seeded value), camelCase serialization.
    - `UpdateCliente_WithUnchangedNit_Returns200` — seed a cliente, PUT the SAME `nit` (along with the rest of the body), assert 200 (NOT 409) — this is AC #8's critical regression test.
    - `UpdateCliente_WithDuplicateNitFromAnotherCliente_Returns409ProblemDetails` — seed TWO clientes (A with `nit=AAA`, B with `nit=BBB`), PUT B with `nit=AAA` (now duplicates A's NIT), assert 409 + `Content-Type: application/problem+json` + body `{ status: 409, title: "El NIT/RUC ya está registrado." }`. Assert NO `stackTrace`, `exception`, or `detail` member that leaks internal info (NFR6).
    - `UpdateCliente_WhenNotFound_Returns404ProblemDetails` — PUT a random `Guid.NewGuid()` id with a valid body against an empty DbContext, assert 404 + Problem Details body with title `"Cliente no encontrado."`. Assert NO stack trace.
    - `UpdateCliente_WithMissingNombre_Returns400ProblemDetails` — seed a cliente, PUT `{ nit: "..." }` with no `nombre`, assert 400 + `errors.nombre` non-empty.
    - `UpdateCliente_WithMissingNit_Returns400ProblemDetails` — seed a cliente, PUT `{ nombre: "..." }` with no `nit`, assert 400 + `errors.nit` non-empty.
    - `UpdateCliente_WithOversizedNombre_Returns400ProblemDetails` — seed a cliente, PUT `nombre` with 201 chars, assert 400 + `errors.nombre` mentions max length.
    - `UpdateCliente_WithInvalidGuid_Returns400` — PUT to `/api/v1/clientes/not-a-guid`, assert 400 via the existing sibling catch-all route (no new code needed; this is a smoke that the route constraint pattern from Story 2.2 keeps working for the PUT verb too).
    - All existing tests from Stories 1.3 + 2.1 + 2.2 + 2.3 MUST remain green — the new endpoint does NOT regress them. Story 2.3 baseline is **73/73 green**; Story 2.4 adds 8 new tests → **81/81 green** target.

14. **Given** the frontend, **When** Vitest + RTL component tests run, **Then** the following automated tests pass:
    - `ClienteForm_renders_with_create_mode_when_no_cliente_prop` (UPDATE existing test) — assert title `"Nuevo cliente"`, empty inputs, footer button labels `[Cancelar]` + `[Guardar]`.
    - `ClienteForm_renders_with_edit_mode_when_cliente_prop_passed` — pass `mode="edit"` + a `Cliente` prop, assert title `"Editar cliente"`, all four inputs pre-filled with the cliente's values, footer buttons unchanged.
    - `ClienteForm_submits_PUT_when_in_edit_mode` — mock `useUpdateCliente`, in edit mode, modify `nombre`, click `Guardar`, assert MSW received `PUT /api/v1/clientes/{id}` with the correct JSON body, assert dialog closes, assert success toast `"Cliente actualizado correctamente"` visible.
    - `ClienteForm_handles_409_duplicate_nit_in_edit_mode` — MSW returns 409 Problem Details for the PUT, assert inline error on `nit` with copy `"El NIT/RUC ya está registrado"`, assert modal stays open, assert NO red toast.
    - `ClienteForm_handles_404_in_edit_mode_with_red_toast_and_close` — MSW returns 404 for the PUT, assert red toast `"No se pudo guardar. Intenta de nuevo."`, dialog closes (per AC #11).
    - `ClienteForm_cancel_in_edit_mode_keeps_original_data` — pass `mode="edit"` + a `Cliente`, mutate `nombre` in the input, click `Cancelar`, assert dialog closes, NO PUT fired, re-open dialog (`open=true` again) and assert input shows the ORIGINAL `nombre` (the form is reset to the original prop values on open).
    - `ClienteForm_blocks_submit_when_required_field_cleared_in_edit_mode` — pass `mode="edit"` + a `Cliente`, clear `nombre` input, click `Guardar`, assert inline error testid for `nombre`, assert NO PUT fired (MSW strict mode), assert focus moves to `nombre`.
    - `ClienteDetailView_renders_btn_editar_cliente` — mount with a mocked `useCliente` returning a full `Cliente`, assert `btn-editar-cliente` testid visible, click opens `cliente-form-dialog` with title `"Editar cliente"`.
    - `ClienteDetailView_does_not_render_btn_editar_when_loading_or_error_or_not_found` — three sub-cases: `isLoading: true`, `isError: true`, `data: null`. Assert `btn-editar-cliente` is NOT present.
    - `useUpdateCliente_invalidates_both_keys_on_success` — hook-level test: success path calls `queryClient.invalidateQueries({ queryKey: ['clientes'] })` AND `queryClient.invalidateQueries({ queryKey: ['clientes', id] })`.
    - `useUpdateCliente_propagates_error_for_409` — hook-level test: MSW returns 409, assert `mutation.error` is the axios error (so the form's `onError` branch can read `err.response?.status === 409`).
    - Story 2.3's `ClienteForm` test suite (10 tests) MUST remain green — the mode="create" path is unchanged in behavior.

15. **Given** the frontend, **When** `pnpm run build` is executed, **Then** the build completes with zero TypeScript errors in strict mode. The eager-loaded JS chunk stays under 500 KB gzipped (Story 2.3 reported 404.53 KB; Story 2.4 budgets a delta of < +5 KB to the eager bundle — `useUpdateCliente` + the edit-mode branch in `ClienteForm` add ~2–3 KB raw; gzip should net under +2 KB. NO new libraries are introduced).

16. **Given** the e2e Playwright project, **When** `pnpm exec playwright test e2e/tests/clientes/clientes-edit.spec.ts` runs (NEW spec), **Then** the following scenarios pass:
    - `edit cliente happy path` — `ApiHelper.createCliente(...)` to seed a cliente, navigate to `/clientes/<id>`, click `btn-editar-cliente`, assert dialog opens with pre-filled values, modify `nombre`, click `Guardar`, assert detail panel shows new `nombre` AND the list panel item (left side) shows new `nombre`, assert success toast `"Cliente actualizado correctamente"` is visible.
    - `cancel keeps original data` — seed cliente, open edit dialog, type a garbage `nombre`, click `Cancelar`, assert detail panel STILL shows the original `nombre`, assert NO toast visible, re-open the dialog and assert it shows the ORIGINAL `nombre` again (no stale state leak).
    - `duplicate NIT shows inline error in edit` — seed TWO clientes (A + B), navigate to B's detail, open edit dialog, change B's `nit` to A's `nit`, click `Guardar`, assert inline error on `nit` with copy `"El NIT/RUC ya está registrado"` and modal stays open. A new API spec extends the existing `e2e/tests/api/clientes-create.api.spec.ts` (or a new `clientes-update.api.spec.ts`) — P0 — R-003 mitigation, covers the raw 409 contract directly against the API.
    - `required field cleared blocks save` — seed cliente, open edit, clear `nombre`, click `Guardar`, assert inline error and modal stays open and NO PUT fired (assert via `page.route` interceptor).

## Tasks / Subtasks

- [ ] Task 1 — Backend: Application command `UpdateClienteCommand` + handler (AC: #3, #7, #8, #11, #12, #13)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`:
    ```csharp
    namespace SiesaAgents.Application.Clientes.Commands;

    public record UpdateClienteCommand(
        Guid Id,
        string Nombre,
        string Nit,
        string? Telefono,
        string? Ciudad);
    ```
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs` — constructor-injects `IClienteRepository`; method `Task<ClienteDto?> Handle(UpdateClienteCommand command, CancellationToken ct)`:
    1. Call `await _repository.GetByIdAsync(command.Id, ct)`. If `null`, return `null` (the endpoint translates to 404 Problem Details — same pattern as Story 2.2's `GetClienteByIdQueryHandler`).
    2. Compute `var trimmedNit = command.Nit.Trim()`.
    3. **NIT uniqueness check (excluding self):** call `await _repository.ExistsByNitExceptIdAsync(trimmedNit, command.Id, ct)` (NEW repository method — see Task 4). If `true`, throw `DuplicateNitException(trimmedNit)`. **CRITICAL — AC #8:** the check MUST exclude the current cliente's `id` so editing without changing the NIT does NOT raise 409.
    4. Call `entity.Update(command.Nombre, command.Nit, command.Telefono, command.Ciudad)` — the existing `ClienteEntity.Update(...)` method (already in place at `Domain/Clientes/Entities/ClienteEntity.cs:54`) performs trimming + null-coalescing + bumps `UpdatedAt`.
    5. Call `await _repository.SaveChangesAsync(ct)`.
    6. Project the entity to `ClienteDto` (same shape as Stories 2.1/2.2/2.3 use).
  - [ ] Register `builder.Services.AddScoped<UpdateClienteCommandHandler>();` in `Program.cs` immediately after `CreateClienteCommandHandler` registration (preserve the explicit handler-by-handler style established in Stories 2.1/2.2/2.3).

- [ ] Task 2 — Backend: FluentValidation validator + DI (AC: #4, #10, #13)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteCommandValidator.cs`:
    ```csharp
    using FluentValidation;
    using SiesaAgents.Application.Clientes.Commands;

    public class UpdateClienteCommandValidator : AbstractValidator<UpdateClienteCommand>
    {
        public UpdateClienteCommandValidator()
        {
            RuleFor(c => c.Id).NotEmpty().WithMessage("Id es requerido.");
            RuleFor(c => c.Nombre)
                .NotEmpty().WithMessage("Nombre es requerido.")
                .MaximumLength(200).WithMessage("Nombre no puede exceder 200 caracteres.");
            RuleFor(c => c.Nit)
                .NotEmpty().WithMessage("NIT/RUC es requerido.")
                .MaximumLength(50).WithMessage("NIT/RUC no puede exceder 50 caracteres.");
            RuleFor(c => c.Telefono)
                .MaximumLength(50).WithMessage("Teléfono no puede exceder 50 caracteres.")
                .When(c => !string.IsNullOrWhiteSpace(c.Telefono));
            RuleFor(c => c.Ciudad)
                .MaximumLength(100).WithMessage("Ciudad no puede exceder 100 caracteres.")
                .When(c => !string.IsNullOrWhiteSpace(c.Ciudad));
        }
    }
    ```
  - [ ] **Same divergence as Story 2.3:** `Telefono` + `Ciudad` are NOT `NotEmpty` server-side because the migration columns are NULLable and `ClienteEntity.Update(...)` accepts null. Frontend Zod enforces all four required per FR1. (Documented in Dev Notes — keep the contract identical to Create for consistency.)
  - [ ] Wire DI: `builder.Services.AddScoped<IValidator<UpdateClienteCommand>, UpdateClienteCommandValidator>();` in `Program.cs` immediately after the `CreateClienteCommandValidator` registration. NO `AddValidatorsFromAssemblyContaining<...>()` — keep DI explicit per the Story 2.3 precedent.

- [ ] Task 3 — Backend: Endpoint `PUT /api/v1/clientes/{id:guid}` (AC: #3, #7, #11, #12, #13)
  - [ ] Modify `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — append a `MapPut` on the existing `group` (place it AFTER the `MapGet("/{id:guid}", ...)` route AND BEFORE the catch-all `MapGet("/{id}", ...)` so the catch-all only matches non-UUID GET requests, not PUTs):
    ```csharp
    group.MapPut("/{id:guid}", async (
        Guid id,
        UpdateClienteCommand body,
        IValidator<UpdateClienteCommand> validator,
        UpdateClienteCommandHandler handler,
        CancellationToken ct) =>
    {
        // Route id is the source of truth — overwrite the body's Id field with it
        // so a malformed body cannot redirect the update to a different cliente.
        var command = body with { Id = id };

        var validation = await validator.ValidateAsync(command, ct);
        if (!validation.IsValid)
        {
            var errors = validation.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            return Results.ValidationProblem(errors);
        }

        try
        {
            var dto = await handler.Handle(command, ct);
            return dto is null
                ? Results.Problem(
                    title: "Cliente no encontrado.",
                    statusCode: StatusCodes.Status404NotFound,
                    type: "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                    instance: $"/api/v1/clientes/{id}")
                : Results.Ok(dto);
        }
        catch (DuplicateNitException)
        {
            return Results.Problem(
                title: "El NIT/RUC ya está registrado.",
                statusCode: StatusCodes.Status409Conflict,
                type: "https://tools.ietf.org/html/rfc7231#section-6.5.8",
                instance: $"/api/v1/clientes/{id}");
        }
    })
    .WithName("UpdateCliente")
    .Accepts<UpdateClienteCommand>("application/json")
    .Produces<ClienteDto>(StatusCodes.Status200OK)
    .ProducesValidationProblem(StatusCodes.Status400BadRequest)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .ProducesProblem(StatusCodes.Status409Conflict);
    ```
  - [ ] **Defense-in-depth note:** the endpoint forcibly overwrites `body.Id` with the route `id` (`var command = body with { Id = id };`). This prevents a malicious or buggy client from PUTting `/api/v1/clientes/A` with a body containing `id: B` and accidentally mutating cliente B. Document in Dev Notes.
  - [ ] Confirm `Results.ValidationProblem(errors)`, `Results.Problem(...)` calls all emit `application/problem+json` automatically (no manual `Content-Type` header needed).

- [ ] Task 4 — Backend: Extend repository contract + implementation (AC: #7, #8, #13)
  - [ ] Extend `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` adding:
    ```csharp
    /// <summary>
    /// Returns true if any cliente OTHER THAN the one with id <paramref name="exceptId"/>
    /// has the given <paramref name="nit"/>. Story 2.4 uses this for the
    /// "edit-without-changing-NIT must not 409" guarantee.
    /// </summary>
    Task<bool> ExistsByNitExceptIdAsync(string nit, Guid exceptId, CancellationToken ct);
    ```
  - [ ] Implement in `backend/src/SiesaAgents.Infrastructure/Data/Repositories/ClienteRepository.cs` (the file already exists from Story 2.1):
    ```csharp
    public Task<bool> ExistsByNitExceptIdAsync(string nit, Guid exceptId, CancellationToken ct)
        => _context.Clientes.AsNoTracking()
            .AnyAsync(c => c.Nit == nit && c.Id != exceptId, ct);
    ```
    Use `AsNoTracking()` — read-only query, no EF Core change tracking needed.
  - [ ] Verify the existing `ExistsByNitAsync(string, CancellationToken)` method is left UNCHANGED — Story 2.3 still uses it for the Create path.

- [ ] Task 5 — Backend: Integration tests for `PUT` (AC: #13)
  - [ ] Create `backend/tests/SiesaAgents.IntegrationTests/ClientesUpdateEndpointTests.cs` reusing the `SiesaAgentsApiFactory` pattern from Stories 2.1/2.2/2.3 (InMemory provider + EF/Npgsql stripping):
    - `UpdateCliente_WithValidPayload_Returns200WithUpdatedClienteDto`
    - `UpdateCliente_WithUnchangedNit_Returns200` (AC #8 critical regression)
    - `UpdateCliente_WithDuplicateNitFromAnotherCliente_Returns409ProblemDetails`
    - `UpdateCliente_WhenNotFound_Returns404ProblemDetails`
    - `UpdateCliente_WithMissingNombre_Returns400ProblemDetails`
    - `UpdateCliente_WithMissingNit_Returns400ProblemDetails`
    - `UpdateCliente_WithOversizedNombre_Returns400ProblemDetails`
    - `UpdateCliente_WithInvalidGuid_Returns400`
  - [ ] Assert NFR6: parse each Problem Details body and verify NO `stackTrace`, `exception`, OR a `detail` that contains a fully-qualified type name. Reuse the small helper from Story 2.3's `ClientesCreateEndpointTests` if one exists; otherwise duplicate it inline.
  - [ ] Existing 73/73 tests MUST remain green (Story 2.3's baseline). New count after this story: 73 + 8 = **81/81 green**.

- [ ] Task 6 — Frontend: Domain + Infrastructure — `update` method (AC: #3, #7, #9, #11)
  - [ ] Extend `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`:
    ```ts
    export interface UpdateClienteInput {
      nombre: string
      nit: string
      telefono: string
      ciudad: string
    }

    export interface IClienteRepository {
      getAll(): Promise<Cliente[]>
      getById(id: string): Promise<Cliente | null>
      create(input: CreateClienteInput): Promise<Cliente>
      update(id: string, input: UpdateClienteInput): Promise<Cliente>
    }
    ```
    `UpdateClienteInput` has the same shape as `CreateClienteInput` — they are intentionally separate types so future stories can diverge (e.g. `nit` becomes optional on update if business rules ever soften).
  - [ ] Extend `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`:
    ```ts
    update: async (id, input) => {
      const r = await apiClient.put<Cliente>(`/api/v1/clientes/${id}`, input)
      return r.data
    },
    ```
    DO NOT catch axios errors here — propagate them so the application layer (hook) can branch on `axios.isAxiosError(err) && err.response?.status === 409` (duplicate NIT inline) / `400` (FluentValidation field errors) / `404` (closed-modal red toast). The 404 path is unique to update (not present in create) — the form's `onError` handler distinguishes 404 from 5xx.

- [ ] Task 7 — Frontend: Application hook `useUpdateCliente` (AC: #3, #7, #14)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`:
    ```ts
    import { useMutation, useQueryClient } from '@tanstack/react-query'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
    import type { UpdateClienteInput } from '../domain/IClienteRepository'

    interface UpdateArgs {
      id: string
      input: UpdateClienteInput
    }

    export function useUpdateCliente() {
      const queryClient = useQueryClient()
      return useMutation({
        mutationFn: ({ id, input }: UpdateArgs) =>
          clienteApiRepository.update(id, input),
        onSuccess: (_data, variables) => {
          queryClient.invalidateQueries({ queryKey: ['clientes'] })
          queryClient.invalidateQueries({ queryKey: ['clientes', variables.id] })
        },
      })
    }
    ```
    The hook invalidates BOTH `['clientes']` (the list) AND `['clientes', id]` (the single-cliente cache from Story 2.2's `useCliente`) so the detail panel re-fetches with the new values immediately.
    The hook does NOT fire the toast or close the dialog — those concerns are owned by the consuming component (`ClienteForm`).
  - [ ] **Optimistic update — deliberately NOT implemented in 2.4:** Story 2.3 §"Why NOT Optimistic Updates for Create?" noted that 2.4 (edit) "WILL be a good candidate for optimistic update because the id is known". After re-evaluation:
    - Optimistic update would force rollback on 409 (duplicate NIT) and 400 (FluentValidation) — adds non-trivial complexity (`onMutate` snapshot + `onError` restore via `setQueryData`).
    - The TanStack `invalidateQueries` path with the modal staying open during the round-trip is acceptable UX for a < 2s CRUD operation (NFR2). A short `Guardando…` button state masks the latency.
    - Skipping optimistic also makes the integration with the success toast simpler (toast only fires on confirmed success — no risk of "fake success" toast).
    Decision: **pure invalidation, no optimistic update**. If/when NFR2 latency budgets tighten, a follow-up refactor can layer optimistic update without touching the component contract.

- [ ] Task 8 — Frontend: Extend `ClienteForm` to support `mode="edit"` (AC: #2, #4, #5, #6, #7, #9, #11, #14)
  - [ ] Modify `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`. Add `mode` + `cliente` props (back-compatible — `mode` defaults to `'create'`):
    ```ts
    interface ClienteFormProps {
      open: boolean
      onOpenChange: (open: boolean) => void
      mode?: 'create' | 'edit'      // defaults to 'create'
      cliente?: Cliente             // required when mode === 'edit'
    }
    ```
    **Story 2.3 Out-of-Scope §Edit form modal** explicitly mandated that `ClienteForm`'s props be structured so 2.4's extension is non-breaking — this lands the contract.
  - [ ] Change the dialog title:
    ```tsx
    <DialogTitle>{mode === 'edit' ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
    ```
  - [ ] Compute default values from the `cliente` prop (when edit mode):
    ```tsx
    const defaultValues = useMemo<ClienteFormValues>(() => {
      if (mode === 'edit' && cliente) {
        return {
          nombre: cliente.nombre,
          nit: cliente.nit,
          telefono: cliente.telefono ?? '',
          ciudad: cliente.ciudad ?? '',
        }
      }
      return { nombre: '', nit: '', telefono: '', ciudad: '' }
    }, [mode, cliente])
    ```
  - [ ] **CRITICAL — reset on open transition (AC #6):** when the dialog re-opens (`open === true`), the form MUST reset to the latest `defaultValues`. Use `useEffect` watching `open` + `defaultValues`:
    ```tsx
    useEffect(() => {
      if (open) {
        reset(defaultValues)
      }
    }, [open, defaultValues, reset])
    ```
    This guarantees that "open → mutate field → Cancelar → re-open" shows the ORIGINAL values, not the stale draft (the edit-mode regression that R-006 mitigates).
  - [ ] Pick the right mutation hook based on mode:
    ```tsx
    const createMutation = useCreateCliente()
    const updateMutation = useUpdateCliente()
    const isPending = mode === 'edit' ? updateMutation.isPending : createMutation.isPending
    ```
    Both hooks are mounted unconditionally (Rules of Hooks). Only one fires per submit.
  - [ ] Change `onSubmit` to branch by mode:
    ```tsx
    function onSubmit(values: ClienteFormValues) {
      if (mode === 'edit' && cliente) {
        updateMutation.mutate(
          { id: cliente.id, input: values },
          {
            onSuccess: () => {
              toast.success('Cliente actualizado correctamente', { duration: 3000 })
              onOpenChange(false)
            },
            onError: (err) => handleMutationError(err, /* closeOnNotFound */ true),
          },
        )
        return
      }

      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success('Cliente creado correctamente', { duration: 3000 })
          reset()
          onOpenChange(false)
        },
        onError: (err) => handleMutationError(err, /* closeOnNotFound */ false),
      })
    }
    ```
    Extract the shared 409 / 400 / fallback branching into a local helper `handleMutationError(err, closeOnNotFound)`. The `closeOnNotFound` flag is only true in edit mode — a 404 in edit means "the record vanished between fetch and PUT", which closes the dialog + red toast (AC #11). 404 is impossible in create mode (the endpoint never returns 404).
  - [ ] Helper body:
    ```tsx
    function handleMutationError(err: unknown, closeOnNotFound: boolean) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          setError('nit', { message: 'El NIT/RUC ya está registrado' })
          return
        }

        if (err.response?.status === 400) {
          const data = err.response.data as
            | { errors?: Record<string, string[]> }
            | undefined
          const fieldErrors = data?.errors
          if (fieldErrors) {
            let mapped = false
            for (const [field, msgs] of Object.entries(fieldErrors)) {
              const key = field.toLowerCase() as keyof ClienteFormValues
              if (key === 'nombre' || key === 'nit' || key === 'telefono' || key === 'ciudad') {
                setError(key, { message: msgs[0] ?? 'Valor inválido' })
                mapped = true
              }
            }
            if (mapped) return
          }
        }

        if (closeOnNotFound && err.response?.status === 404) {
          toast.error('No se pudo guardar. Intenta de nuevo.', { duration: 5000 })
          onOpenChange(false)
          return
        }
      }

      toast.error('No se pudo guardar. Intenta de nuevo.', { duration: 5000 })
    }
    ```
  - [ ] The cancel button's `handleCancel` resets to `defaultValues` (NOT to empty), so re-opening shows the latest pristine cliente values:
    ```tsx
    function handleCancel() {
      reset(defaultValues)
      onOpenChange(false)
    }
    ```
  - [ ] **Submit button label stays `"Guardar"`** in both modes (no `"Actualizar"` variant) — UX spec §Button Hierarchy uses one verb across CRUD forms. Loading state shows `"Guardando…"` in both modes.
  - [ ] **autoFocus on Nombre stays as-is** — in edit mode, the cursor will land at the end of the existing value by default (React Hook Form + native input behavior). No special handling needed.
  - [ ] All other JSX (Field components, dialog footer, etc.) remains unchanged.

- [ ] Task 9 — Frontend: Wire `"Editar"` button into `ClienteDetailView` (AC: #1, #2, #14)
  - [ ] Modify `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
    1. Add local state `const [isEditOpen, setIsEditOpen] = useState(false)`.
    2. Import `ClienteForm` from `./ClienteForm`.
    3. ONLY in the `data` (loaded valid cliente) branch — render the `"Editar"` button at the TOP of the `<section>` ABOVE the `<dl>`:
       ```tsx
       <section data-testid="cliente-detail-panel" aria-label="Detalle del cliente">
         <div className="flex items-center justify-between p-6 pb-0">
           <h3 className="sr-only">Acciones del cliente</h3>
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
         <dl className="grid grid-cols-[120px_1fr] gap-x-6 gap-y-3 p-6">
           {/* unchanged */}
         </dl>
         <ClienteForm
           open={isEditOpen}
           onOpenChange={setIsEditOpen}
           mode="edit"
           cliente={data}
         />
       </section>
       ```
    4. The button is ONLY rendered when `data` is a valid `Cliente` — not in the `isLoading`, `isError`, or `data === null` branches. This is enforced by JSX structure (the button lives inside the final `return` branch only).
    5. The `<ClienteForm>` is co-located inside this same branch so its `cliente` prop is always a valid `Cliente` (TypeScript-safe).

- [ ] Task 10 — Frontend: Component tests (AC: #14)
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx`:
    - Add a `describe('edit mode', ...)` block covering ALL the `ClienteForm_*_in_edit_mode` sub-cases listed in AC #14.
    - Update the `ClienteForm_submits_valid_payload_and_closes` test name to be explicit about create mode (e.g. `ClienteForm_renders_with_create_mode_when_no_cliente_prop` etc.).
    - Use MSW handlers for `PUT /api/v1/clientes/:id` returning 200, 409 + Problem Details, 404 + Problem Details, and 500.
    - Reset MSW handlers between tests (already done — verify the existing `beforeEach`).
    - Wrap each test in fresh `QueryClient` + the same `ToastProvider` mock used by 2.3.
  - [ ] Create `frontend/src/modules/crm/clientes/application/__tests__/useUpdateCliente.test.tsx` mirroring the structure of Story 2.3's `useCreateCliente.test.tsx`:
    - `useUpdateCliente_invalidates_both_keys_on_success` — `vi.spyOn(queryClient, 'invalidateQueries')`, assert TWO calls (one with `['clientes']`, one with `['clientes', id]`).
    - `useUpdateCliente_propagates_error_for_409` — MSW returns 409, assert `result.current.error` is non-null axios error.
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx` (Story 2.2) — add:
    - `ClienteDetailView_renders_btn_editar_cliente` (mounted state)
    - `ClienteDetailView_does_not_render_btn_editar_when_loading_or_error_or_not_found` (three sub-cases)
    - `ClienteDetailView_opens_edit_dialog_on_btn_click` — click the button, assert `cliente-form-dialog` testid is visible and title is `"Editar cliente"`.
  - [ ] All frontend tests run via `pnpm test`. Story 2.3 baseline was 75/75 green; Story 2.4 adds ~10 new specs → target **≥ 85/85 green**.

- [ ] Task 11 — Frontend: Build verification (AC: #15)
  - [ ] Run `pnpm run build`. Confirm:
    - Zero TypeScript errors in strict mode.
    - Eager chunk gzipped size ≤ 410 KB (Story 2.3 baseline 404.53 KB + budget 5 KB for `useUpdateCliente` + the edit-mode branch).
    - The clientes lazy chunk may grow slightly (expected — `useUpdateCliente` lands here, ~1 KB). NO new npm dependency is added.

- [ ] Task 12 — E2E: Update Playwright POM + new spec (AC: #16)
  - [ ] Extend `e2e/pages/clientes.page.ts` adding:
    - `btnEditarCliente = page.getByTestId('btn-editar-cliente')`
    - `toastUpdateSuccess = page.getByText('Cliente actualizado correctamente')`
    - (Reuse the existing `formDialog`, `formErrorNombre`, `formErrorNit`, `formErrorTelefono`, `formErrorCiudad` locators from Story 2.3 — they are mode-agnostic.)
  - [ ] Create `e2e/tests/clientes/clientes-edit.spec.ts` (NEW) covering ALL four scenarios in AC #16. Use `ApiHelper.createCliente(...)` (from Story 2.3) to seed test data. For the "duplicate NIT" scenario, seed TWO clientes via the API helper.
  - [ ] Extend `e2e/tests/api/clientes-create.api.spec.ts` (Story 2.3) — append a PUT block (or create `e2e/tests/api/clientes-update.api.spec.ts` — preferred for organizational clarity) with:
    1. `PUT /api/v1/clientes/{id}` with valid payload → 200 + body has new values.
    2. `PUT` with unchanged NIT → 200 (AC #8 — the regression that proves the uniqueness check excludes self).
    3. `PUT` with duplicate NIT from another cliente → 409 + Spanish title.
    4. `PUT` with unknown `id` → 404 + Spanish title.
    5. `PUT` with missing `nombre` → 400 + `errors.nombre` non-empty.
  - [ ] `pnpm exec playwright test e2e/tests/clientes/clientes-edit.spec.ts e2e/tests/api/clientes-update.api.spec.ts` must be green when backend + frontend are running.

- [ ] Task 13 — Verify & document (AC: all)
  - [ ] Run end-to-end verification locally:
    - `dotnet build SiesaAgents.sln` → 0/0 errors and warnings.
    - `dotnet test` → 81/81 tests green (73 from 2.1+2.2+2.3 + 8 new from this story).
    - `pnpm test` → all frontend tests green (Story 2.3 suite intact + the new `useUpdateCliente.test.tsx` + the updated `ClienteForm.test.tsx` + the updated `ClienteDetailView.test.tsx`).
    - `pnpm run build` → zero TS errors, eager chunk ≤ 410 KB gzipped.
    - Manual smoke: `dotnet run --project src/SiesaAgents.API` + `pnpm dev` → navigate to `http://localhost:5173/clientes`, create a cliente, click it, click `Editar`, modify `nombre`, click `Guardar` → toast `"Cliente actualizado correctamente"` + detail panel + list item reflect new `nombre` immediately. Re-open the edit dialog, change `nit` to one that already exists on another cliente → inline 409 error on `nit`. Click `Cancelar` → original cliente data unchanged.
    - `pnpm exec playwright test e2e/tests/clientes/` → all green when stack running.
  - [ ] Append Completion Notes covering: exact frontend bundle size delta vs. Story 2.3; whether the optimistic-update path was reconsidered; FluentValidation registration approach; any deviation from the Dev Notes patterns; the result of the AC #8 regression test ("PUT with unchanged NIT returns 200").

## Dev Notes

### Architecture Compliance

Per `_bmad-output/planning-artifacts/architecture.md` and `.claude/agent-memory/sa-quick-dev/company-standards.md`:

- **CQRS** — `UpdateClienteCommand` (write) + `UpdateClienteCommandHandler` mirror the Create pattern from Story 2.3. Commands live under `Application/Clientes/Commands/`; handlers register as `Scoped` in `Program.cs`. The handler returns `ClienteDto?` (nullable) so the endpoint can translate `null` → 404 Problem Details without throwing — same pattern as Story 2.2's `GetClienteByIdQueryHandler`.
- **Validation** — backend uses FluentValidation (`AbstractValidator<UpdateClienteCommand>`); frontend uses Zod + React Hook Form. The two layers mirror each other but the backend is authoritative (NFR5). The Zod schema is reused as-is from Story 2.3 (`clienteFormSchema`) — the schema is mode-agnostic.
- **Problem Details RFC 7807** — `Results.ValidationProblem(errors)` (for 400) and `Results.Problem(...)` (for 404 + 409) BOTH emit `application/problem+json` automatically. No manual JSON serialization. The 404 + 409 responses MUST NOT include `stackTrace`, `exception`, or `detail` with internal info (NFR6, R-003).
- **UUID PKs** — `ClienteEntity.Update(...)` preserves `Id`; `Id` is never mutated post-creation (per the Entity pattern in company-standards.md).
- **`DateTimeOffset` everywhere** — `ClienteEntity.Update(...)` bumps `UpdatedAt = DateTimeOffset.UtcNow`; `CreatedAt` is preserved.
- **TanStack Query mutation pattern** — `useUpdateCliente` invalidates BOTH `['clientes']` AND `['clientes', id]` on success. This propagates the new values to both the list panel (Story 2.1) AND the detail panel (Story 2.2) without a manual refresh.
- **TanStack Query keys** — `['clientes']` for the list + `['clientes', id]` for the single cliente (canonical per architecture.md §State Boundaries lines 632 / 279).
- **Spanish UI** — every visible string in the form must be Spanish: button labels (`Editar`, `Guardar`, `Cancelar`), dialog title (`Editar cliente`), field labels (with `*` for required), error messages, toasts, ARIA labels. Code (variables, hooks, types) MUST be in English.
- **siesa-ui-kit vs shadcn Dialog** — same as Story 2.3. The form uses shadcn's `Dialog` + react-hook-form + Zod + siesa-ui-kit `toast`. NO `MasterCrudForm`. NO new components from the kit are introduced.
- **MasterCrud — explicitly not used** — per `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`, MasterCrud is the orchestrator for "data grids + forms + filters". Direction F rejected it for clientes/contactos (Story 2.1); 2.4 continues that decision. The edit form is a parameterized extension of Story 2.3's custom Radix Dialog + react-hook-form + Zod + shadcn primitives. Variance is intentional and documented.
- **`Scalar` not Swagger** — the new `MapPut("/{id:guid}")` chain `.Accepts<>` + `.Produces<>` + `.ProducesValidationProblem` + `.ProducesProblem(404)` + `.ProducesProblem(409)` decorations supply Scalar with full OpenAPI metadata.
- **WCAG 2.1 AA** — the `Editar` button has `aria-label="Editar cliente"` (in case the visible text is ever truncated). Required-field semantics in the edit form use BOTH `*` in the label AND `aria-required="true"` on the input (already in place from Story 2.3's `Field` component). Error messages use `aria-invalid="true"` + `aria-describedby` pointing at the error `<p>`.

### Backend Validator Field-Required Semantics — Deliberate Divergence (continues Story 2.3)

FR6 (edit) inherits the same UI-vs-domain divergence as FR1 (create):
- Frontend Zod (`clienteFormSchema`) enforces all four fields as required.
- Backend `UpdateClienteCommandValidator` only enforces `Nombre` + `Nit` as `NotEmpty` (matching `ClienteEntity.Update(...)`'s invariants).

Rationale: the migration columns for `telefono` + `ciudad` are NULLable; `ClienteEntity.Update(...)` accepts null/empty and stores as null. Tightening the API to reject empty `telefono` / `ciudad` would require either a migration (NULL → NOT NULL) or a server-side rule contradicting the entity. Frontend enforcement is sufficient for the UX expectation; a direct API client sending empty `telefono` / `ciudad` gets 200.

### Backend Endpoint Pattern

```csharp
group.MapPut("/{id:guid}", async (
    Guid id,
    UpdateClienteCommand body,
    IValidator<UpdateClienteCommand> validator,
    UpdateClienteCommandHandler handler,
    CancellationToken ct) =>
{
    var command = body with { Id = id };  // route id wins over body id (defense in depth)

    var validation = await validator.ValidateAsync(command, ct);
    if (!validation.IsValid)
    {
        var errors = validation.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
        return Results.ValidationProblem(errors);
    }

    try
    {
        var dto = await handler.Handle(command, ct);
        return dto is null
            ? Results.Problem(
                title: "Cliente no encontrado.",
                statusCode: StatusCodes.Status404NotFound,
                type: "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                instance: $"/api/v1/clientes/{id}")
            : Results.Ok(dto);
    }
    catch (DuplicateNitException)
    {
        return Results.Problem(
            title: "El NIT/RUC ya está registrado.",
            statusCode: StatusCodes.Status409Conflict,
            type: "https://tools.ietf.org/html/rfc7231#section-6.5.8",
            instance: $"/api/v1/clientes/{id}");
    }
})
.WithName("UpdateCliente")
.Accepts<UpdateClienteCommand>("application/json")
.Produces<ClienteDto>(StatusCodes.Status200OK)
.ProducesValidationProblem(StatusCodes.Status400BadRequest)
.ProducesProblem(StatusCodes.Status404NotFound)
.ProducesProblem(StatusCodes.Status409Conflict);
```

Notes:
- **Route-id override** (`var command = body with { Id = id };`) — prevents path/body mismatch from mutating an unintended cliente. This is a cheap defense-in-depth measure.
- **404 vs 409 ordering** — the handler's null-check runs BEFORE the NIT uniqueness check, so a 404 always wins over a 409 (consistent with REST semantics: "the resource you're editing doesn't exist" is a more fundamental failure than "the new NIT collides").
- The 409 catch is INLINE rather than going through the global `ExceptionHandlingMiddleware` (Story 1.3) — same pattern as Story 2.3's `MapPost`. Keeps the cross-cutting middleware unchanged.
- The catch-all `MapGet("/{id}", ...)` from Story 2.2 only matches GET — it does NOT intercept PUT. A `PUT /api/v1/clientes/not-a-guid` will NOT match the `{id:guid}` PUT route and the request falls through to .NET's default routing → 404 from `MapFallback` (currently). **AC #13's `UpdateCliente_WithInvalidGuid_Returns400` test:** if .NET returns 404 instead of 400 for non-UUID PUT paths, mirror the GET pattern — add a sibling `group.MapPut("/{id}", ...)` returning 400 Problem Details. Implementation tip: do this only if the test reveals the gap; otherwise leave the GET-only catch-all alone.

### Handler Pattern

```csharp
namespace SiesaAgents.Application.Clientes.Commands;

public class UpdateClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public UpdateClienteCommandHandler(IClienteRepository repository)
        => _repository = repository;

    public async Task<ClienteDto?> Handle(UpdateClienteCommand command, CancellationToken ct)
    {
        var entity = await _repository.GetByIdAsync(command.Id, ct);
        if (entity is null) return null;

        var trimmedNit = command.Nit.Trim();

        // AC #8 — exclude the current cliente's id so editing without changing
        // the NIT does NOT raise a false-positive 409.
        if (await _repository.ExistsByNitExceptIdAsync(trimmedNit, command.Id, ct))
            throw new DuplicateNitException(trimmedNit);

        entity.Update(
            command.Nombre,
            command.Nit,
            command.Telefono,
            command.Ciudad);

        await _repository.SaveChangesAsync(ct);

        return new ClienteDto
        {
            Id = entity.Id,
            Nombre = entity.Nombre,
            Nit = entity.Nit,
            Telefono = entity.Telefono,
            Ciudad = entity.Ciudad,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
        };
    }
}
```

The `entity.Update(...)` call mutates the EF-tracked entity in place; `SaveChangesAsync` flushes the change set. NO `await _repository.UpdateAsync(entity, ...)` is needed — EF Core tracks `entity` from the `GetByIdAsync` call.

### Backend Repository — New Method

```csharp
// In SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs:
Task<bool> ExistsByNitExceptIdAsync(string nit, Guid exceptId, CancellationToken ct);

// In SiesaAgents.Infrastructure/Data/Repositories/ClienteRepository.cs:
public Task<bool> ExistsByNitExceptIdAsync(string nit, Guid exceptId, CancellationToken ct)
    => _context.Clientes.AsNoTracking()
        .AnyAsync(c => c.Nit == nit && c.Id != exceptId, ct);
```

`AsNoTracking()` because it's a read-only check — no EF change tracking overhead.

### Frontend `useUpdateCliente` Pattern (matches architecture.md §Process Patterns)

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { UpdateClienteInput } from '../domain/IClienteRepository'

interface UpdateArgs {
  id: string
  input: UpdateClienteInput
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: UpdateArgs) =>
      clienteApiRepository.update(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['clientes', variables.id] })
    },
  })
}
```

Toast firing + dialog close happen in the consuming component (`ClienteForm`), NOT in the hook — same separation-of-concerns rule as Story 2.3's `useCreateCliente`.

### Frontend `ClienteForm` — Mode Branching Diff (vs. Story 2.3)

```diff
 interface ClienteFormProps {
   open: boolean
   onOpenChange: (open: boolean) => void
+  mode?: 'create' | 'edit'  // defaults to 'create'
+  cliente?: Cliente         // required when mode === 'edit'
 }

 export function ClienteForm({
   open,
   onOpenChange,
+  mode = 'create',
+  cliente,
 }: ClienteFormProps) {
+  const defaultValues = useMemo<ClienteFormValues>(() => {
+    if (mode === 'edit' && cliente) {
+      return {
+        nombre: cliente.nombre,
+        nit: cliente.nit,
+        telefono: cliente.telefono ?? '',
+        ciudad: cliente.ciudad ?? '',
+      }
+    }
+    return { nombre: '', nit: '', telefono: '', ciudad: '' }
+  }, [mode, cliente])

   const { register, handleSubmit, setError, reset, formState: { errors } } =
     useForm<ClienteFormValues>({
       resolver: zodResolver(clienteFormSchema),
       mode: 'onSubmit',
       reValidateMode: 'onChange',
-      defaultValues: { nombre: '', nit: '', telefono: '', ciudad: '' },
+      defaultValues,
     })

+  useEffect(() => {
+    if (open) reset(defaultValues)
+  }, [open, defaultValues, reset])

-  const mutation = useCreateCliente()
+  const createMutation = useCreateCliente()
+  const updateMutation = useUpdateCliente()
+  const isPending = mode === 'edit' ? updateMutation.isPending : createMutation.isPending

   /* onSubmit branches by mode — see Task 8 for the full body */
```

The diff is minimal and additive — the Story 2.3 create path is preserved unchanged.

### Frontend Error Handling Decision Tree (edit mode)

```
err (in mode === 'edit')
│
├── axios.isAxiosError(err) && status === 409
│     → setError('nit', { message: 'El NIT/RUC ya está registrado' })
│     → modal stays open
│
├── axios.isAxiosError(err) && status === 400 && err.response.data?.errors
│     → for each field in errors: setError(field, { message: errors[field][0] })
│     → modal stays open
│
├── axios.isAxiosError(err) && status === 404
│     → toast.error('No se pudo guardar. Intenta de nuevo.')
│     → onOpenChange(false)  // CLOSE the modal — the record vanished
│
└── else (5xx, network, anything else)
      → toast.error('No se pudo guardar. Intenta de nuevo.')
      → modal stays open with values intact
```

The 404 path is the ONLY new branch vs. Story 2.3's create-mode tree. Closing the modal on 404 is intentional: keeping it open would invite the user to retry against a non-existent record forever.

### Frontend Layout (Story 2.4 changes — diff vs. Story 2.3)

```
┌────────┬───────────────────────────┬───────────────────────────────────────┐
│  Nav   │  Clientes panel (280px)  │  Detail panel (flex-1)                │
│ Rail   │  ┌─────────────────────┐ │  ┌──────────────────────────────────┐ │
│ (72)   │  │ [Nuevo cliente]     │ │  │  [Editar] ◄ NEW (2.4)            │ │
│        │  ├─────────────────────┤ │  │ Nombre   Cliente A                │ │
│        │  │ search input        │ │  │ NIT/RUC  900.123.456-7            │ │
│        │  ├─────────────────────┤ │  │ Teléfono +57 300 000 0000         │ │
│        │  │ Cliente A ◄ active  │ │  │ Ciudad   Medellín                 │ │
│        │  │ 900.123.456-7       │ │  └──────────────────────────────────┘ │
│        │  └─────────────────────┘ │                                       │
└────────┴───────────────────────────┴───────────────────────────────────────┘

Edit Modal (same shell as Story 2.3, different title + pre-filled values):
┌─────────────────────────────────────┐
│  Editar cliente            [✕]      │
├─────────────────────────────────────┤
│  Nombre *                           │
│  [Cliente A_____________]           │
│                                     │
│  NIT/RUC *                          │
│  [900.123.456-7_________]           │
│                                     │
│  Teléfono *                         │
│  [+57 300 000 0000______]           │
│                                     │
│  Ciudad *                           │
│  [Medellín______________]           │
│                                     │
│  * Campos obligatorios              │
├─────────────────────────────────────┤
│              [Cancelar]  [Guardar]  │
└─────────────────────────────────────┘
```

Button styles (from UX spec §Button Hierarchy, identical to Story 2.3):
- Primary (`Editar`, `Guardar`): `bg-[#0e79fd] text-white font-semibold` + hover `bg-[#154ca9]`.
- Secondary (`Cancelar`): `border border-slate-300 hover:bg-slate-50`.

### Backend FluentValidation Registration — Important DI Note (continues Story 2.3 style)

Add new registrations to `Program.cs` IN THE SAME EXPLICIT STYLE as Story 2.3, immediately after the existing block:

```csharp
builder.Services.AddScoped<UpdateClienteCommandHandler>();
builder.Services.AddScoped<IValidator<UpdateClienteCommand>, UpdateClienteCommandValidator>();
```

Required usings (most already present from Story 2.3):
- `using FluentValidation;`
- `using SiesaAgents.Application.Clientes.Commands;`
- `using SiesaAgents.Application.Clientes.Validators;`

**Do NOT** call `builder.Services.AddValidatorsFromAssemblyContaining<...>()`. Same reasoning as Story 2.3.

### "Cancelar" Behavior — R-006 Mitigation (CRITICAL)

The test-design epic-2 file (R-006) flags this exact bug: **"Cancelar on edit form may persist accidental field changes if state is shared with detail panel"**.

The implementation defends against this in three ways:
1. **`useEffect(() => { if (open) reset(defaultValues) }, [open, defaultValues, reset])`** — every time the dialog re-opens, the form is FORCED back to the latest pristine `cliente` prop values. No stale draft survives a close/re-open cycle.
2. **`handleCancel` calls `reset(defaultValues)` BEFORE `onOpenChange(false)`** — clean state on unmount.
3. **The `cliente` prop is sourced from `useCliente(clienteId).data` in `ClienteDetailView`** — TanStack Query's cache is the source of truth. The form NEVER mutates the cache directly; the only path to update the cache is a successful PUT + invalidate.

The R-006 mitigation test (Component test in `ClienteForm.test.tsx`: "open edit, mutate field, click Cancelar, assert pristine values restored") is part of AC #14 (`ClienteForm_cancel_in_edit_mode_keeps_original_data`).

### Why NOT Optimistic Updates for Edit?

Story 2.3 §"Why NOT Optimistic Updates for Create?" noted Edit (2.4) WOULD be a good candidate because the id is known. After re-evaluation:

- **Rollback on 409 is non-trivial** — would need `onMutate` snapshot of BOTH `['clientes']` AND `['clientes', id]` caches, then `setQueryData` rollback in `onError`. The cliente object lives in two caches, doubling the bookkeeping.
- **Rollback on 400 (FluentValidation field errors) requires the modal to stay open AND the field-level errors mapped** — the optimistic-applied values must NOT be reflected in the cache during the round-trip, otherwise a brief "fake save" would flash. Net: optimistic-update only helps the happy path while complicating every error path.
- **NFR2 already gives a 2s round-trip budget** — well within the "modal stays open with a `Guardando…` button" UX without optimistic.
- **The `useUpdateCliente` hook contract stays purely declarative** — easier to test and reason about.

Decision: **pure invalidation, no optimistic update**, identical to Story 2.3's stance.

A future story (e.g. an offline-first scenario or a perceived-latency tightening) can layer optimistic update without touching the component contract — the hook signature `useUpdateCliente({ id, input })` is forward-compatible.

### Out of Scope (Deferred Stories)

- Delete confirmation + `DELETE /api/v1/clientes/{id}` — Story 2.5. The `ClienteDetailView` will get an `Eliminar` button alongside the `Editar` button (placed in the same top-of-panel button bar).
- SortControl (`Más reciente`, etc.) — Story 2.6.
- Ciudad as a Select with predefined options — same deferral as Story 2.3 (plain `<input>` for MVP).
- ContactManager INSIDE the edit form — Epic 4.
- Audit log of edits (`updated_by_user_id`, history of changes) — explicitly out-of-scope for MVP per architecture.md scope.

### Project Structure Notes

- New backend files match `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure` (lines 524, 525, 539):
  - `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`
  - `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`
  - `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteCommandValidator.cs`
  - `backend/tests/SiesaAgents.IntegrationTests/ClientesUpdateEndpointTests.cs` (NEW)
- New frontend files:
  - `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
  - `frontend/src/modules/crm/clientes/application/__tests__/useUpdateCliente.test.tsx`
- Modified frontend files:
  - `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — adds `UpdateClienteInput` + `update` signature
  - `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — adds `update` method
  - `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` — adds `mode` + `cliente` props, branches `onSubmit` by mode, resets defaults on open
  - `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — adds `btn-editar-cliente` + mounts `ClienteForm` with `mode="edit"`
  - `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx` — adds `describe('edit mode', ...)` block
  - `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx` — adds button + dialog-open assertions
- Modified backend files:
  - `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — adds `PUT /{id:guid}` to the existing group
  - `backend/src/SiesaAgents.API/Program.cs` — DI for `UpdateClienteCommandHandler` + `IValidator<UpdateClienteCommand>`
  - `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — adds `ExistsByNitExceptIdAsync` signature
  - `backend/src/SiesaAgents.Infrastructure/Data/Repositories/ClienteRepository.cs` — implements `ExistsByNitExceptIdAsync`
- Modified e2e files:
  - `e2e/pages/clientes.page.ts` — adds `btnEditarCliente` + `toastUpdateSuccess` locators
- New e2e files:
  - `e2e/tests/clientes/clientes-edit.spec.ts` (NEW spec)
  - `e2e/tests/api/clientes-update.api.spec.ts` (NEW — R-003 mitigation, 5 PUT scenarios)

### Detected Conflicts / Variances

- **`MasterCrud` rejection continues** — same UX/architecture justification as Stories 2.1 / 2.2 / 2.3. The edit form is a parameterized extension of the Story 2.3 shadcn `Dialog` + react-hook-form + Zod. NO `MasterCrud` import lands.
- **Backend validator field-required mismatch (continues 2.3)** — frontend enforces all four required; backend enforces only `Nombre` + `Nit`. Documented above.
- **Inline 409 catch vs global middleware** — continues Story 2.3's pattern. The PUT endpoint catches `DuplicateNitException` inline.
- **Inline 404 (null-handler) vs middleware** — the handler returns `null` for "not found"; the endpoint maps to a 404 Problem Details. This mirrors Story 2.2's `GetClienteByIdQueryHandler` pattern. No new global exception path is introduced.
- **Bundle budget** — Story 2.3 reported the eager chunk at 404.53 KB gzipped. Story 2.4 budget: ≤ +5 KB to eager (target ≤ 410 KB). The new `useUpdateCliente` hook + edit-mode branch in `ClienteForm` are small (~2–3 KB raw, < 1 KB gzipped) and land in the lazy `clientes` chunk.
- **Route-id override in PUT** (`var command = body with { Id = id };`) — new defense-in-depth measure not present in Story 2.3's POST (because POST has no path id to conflict with the body). Documented in the endpoint pattern section.
- **`UpdateClienteCommandValidator` includes a `RuleFor(c => c.Id).NotEmpty()` rule** — even though the endpoint overrides `Id` from the route, the validator runs on the post-override command. Including the rule guards against a future refactor that loses the override (cheap defense-in-depth).
- **No optimistic update** — explicit reversal of Story 2.3's "2.4 will be a good candidate" hint. Documented above with full reasoning.
- **`ClienteForm` prop contract grew from 2 props to 4** — backward-compatible (both new props are optional with safe defaults). Story 2.3 explicitly designed the contract for this growth.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.4]
- Architecture — API & Communication Patterns (PUT /api/v1/clientes/{id}, response shapes): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — Process Patterns (mutation invalidation + toast): [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- Architecture — Enforcement Guidelines: [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Architecture — State Boundaries (query keys `['clientes']` + `['clientes', id]`): [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Architecture — Requirements to Structure Mapping (FR6 → ClienteForm + useUpdateCliente + UpdateClienteCommandHandler, line 667): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- Architecture — Project Structure (`UpdateClienteCommand.cs`, `UpdateClienteCommandHandler.cs`, `UpdateClienteRequestValidator.cs`, lines 524–539): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Implementation Patterns & Consistency Rules: [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- PRD — Functional Requirement FR6 (edit cliente): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management]
- PRD — Functional Requirement FR8 (prevent saving incomplete records): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management]
- PRD — Functional Requirement FR27 (data changes propagate immediately): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Data Quality & Administration]
- PRD — NFR2 (CRUD round-trip < 2s): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Performance]
- PRD — NFR5 (input sanitization): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Security]
- PRD — NFR6 (no stack trace exposure): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Security]
- UX — Form Patterns (Dialog shadcn, max-w-md, * required, footer order): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns]
- UX — Button Hierarchy (primary `Editar`/`Guardar`, outline `Cancelar`): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Button Hierarchy]
- UX — Toasts (Spanish copy, 3s success / 5s error, position): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Toasts]
- UX — Validación de formularios (`onBlur` + `onSubmit` + `onChange` after first error): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Validación de formularios]
- UX — Modal & Overlay Patterns (Esc + click outside + ✕, autoFocus, focus return): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Modal & Overlay Patterns]
- Test Design Epic 2 — P0/P1 scenarios for Story 2.4 (edit, cancel, duplicate NIT, required field): [Source: _bmad-output/test-design-epic-2.md]
- Risk R-003 (NIT uniqueness server-side, applies to PUT too): [Source: _bmad-output/test-design-epic-2.md#Risk Assessment]
- Risk R-006 (Cancelar on edit form may persist accidental changes): [Source: _bmad-output/test-design-epic-2.md#Risk Assessment]
- Risk R-007 (TanStack invalidate after mutation): [Source: _bmad-output/test-design-epic-2.md#Risk Assessment]
- Risk R-012 (toast Spanish copy): [Source: _bmad-output/test-design-epic-2.md#Risk Assessment]
- Story 2.1 (ClienteEntity factory, ClienteEntity.Update method, repository, ApplySnakeCaseNaming, list view): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Story 2.2 (split-panel layout, useCliente hook, ClienteDetailView, 404 → null translation): [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md]
- Story 2.3 (CreateClienteCommand pattern, ClienteForm shell, ToastProvider mount, DuplicateNitException, FluentValidation registration style): [Source: _bmad-output/implementation-artifacts/2-3-create-client.md]
- Story 1.3 (ExceptionHandlingMiddleware, Problem Details, DbContext): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]
- Company standards — Frontend / Backend / Database conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- siesa-ui-kit MasterCrud reference (NOT used — see Variances): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (create-story workflow, autonomous execution via sa-create-story sub-agent)

### Debug Log References

- `dotnet build SiesaAgents.sln` → Build succeeded, 0 warnings, 0 errors.
- `dotnet test --no-build` → 32 unit + 49 integration = **81/81 green** (73 baseline + 8 new from this story).
- `pnpm test --run` (frontend) → **87/87 green** (75 baseline + 12 new from this story).
- `pnpm run build` (frontend) → succeeded, eager `index-*.js` chunk = 1,371.97 KB / **404.53 KB gzipped** (within ≤410 KB budget; no delta vs Story 2.3 baseline since `useUpdateCliente` + edit branch landed in the lazy `clientes._clienteId-*.js` chunk).

### Completion Notes List

- **Bundle delta vs Story 2.3:** eager chunk gzipped size unchanged at 404.53 KB; the new `useUpdateCliente` hook and `ClienteForm` edit-mode branch live in the lazy `clientes._clienteId-*.js` chunk (3.27 KB raw / 1.19 KB gzipped). Story budget met.
- **Optimistic update path reconsidered:** stayed with pure invalidation as the story recommended after re-evaluation. Hook signature is forward-compatible — a future story can layer optimistic without changing component contracts.
- **FluentValidation registration approach:** continued the explicit-handler-by-handler style from Stories 2.1/2.2/2.3. Added `AddScoped<UpdateClienteCommandHandler>` and `AddScoped<IValidator<UpdateClienteCommand>, UpdateClienteCommandValidator>` immediately after the Create registrations in `Program.cs`. No `AddValidatorsFromAssemblyContaining<...>` was introduced.
- **Repository tracking variant:** the story's handler example assumes `GetByIdAsync` returns a tracked entity, but the existing repository uses `AsNoTracking()` (since Story 2.2's GET endpoint never mutates). Added `GetByIdForUpdateAsync(Guid, CancellationToken)` to `IClienteRepository` + `ClienteRepository` (no `AsNoTracking`) so the Update handler can mutate via EF Core change tracking, leaving the GET path untouched. Documented in this note as a divergence from the Dev Notes wording.
- **AC #8 regression test passes:** `UpdateCliente_WithUnchangedNit_Returns200` confirms editing a cliente with its own existing NIT returns 200, NOT 409 — the `ExistsByNitExceptIdAsync(nit, exceptId)` check excludes the current id.
- **Route-id override:** the PUT endpoint forces `command = body with { Id = id };` so a malicious/buggy client cannot redirect the update by submitting a different `id` in the body. The validator's `RuleFor(c => c.Id).NotEmpty()` runs on the post-override command (cheap defense-in-depth).
- **Sibling catch-all for PUT non-UUIDs:** added `group.MapPut("/{id}", ...) → 400 Problem Details` so the AC #13 `UpdateCliente_WithInvalidGuid_Returns400` test passes deterministically (otherwise non-UUID PUTs would fall through to `MapFallback` and return 404).
- **404 path in edit mode:** the `ClienteForm` `handleMutationError` helper accepts a `closeOnNotFound` flag (true only in edit mode) so a 404 closes the modal + fires the red toast. In create mode the path is impossible — the POST endpoint never returns 404. The 5xx / network fallback keeps the modal open with values intact.
- **R-006 mitigation:** `useEffect(() => { if (open) reset(defaultValues) }, [open, defaultValues, reset])` forces the form back to the latest cliente prop values on every dialog re-open. Verified by `ClienteForm_cancel_in_edit_mode_keeps_original_data`.

### File List

**Created (backend):**
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteCommandValidator.cs`
- `backend/tests/SiesaAgents.IntegrationTests/ClientesUpdateEndpointTests.cs`

**Modified (backend):**
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — added `PUT /{id:guid}` + sibling `PUT /{id}` catch-all for 400 on non-UUID
- `backend/src/SiesaAgents.API/Program.cs` — registered `UpdateClienteCommandHandler` + `IValidator<UpdateClienteCommand>`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — added `ExistsByNitExceptIdAsync` + `GetByIdForUpdateAsync`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implemented both new methods

**Created (frontend):**
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
- `frontend/src/modules/crm/clientes/application/__tests__/useUpdateCliente.test.tsx`

**Modified (frontend):**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — added `UpdateClienteInput` + `update(id, input)` signature
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implemented `update`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` — added `mode` + `cliente` props, branched submit + reset on open
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — added `btn-editar-cliente` + co-located `<ClienteForm mode="edit" />`
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx` — added edit-mode describe block (6 new tests)
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx` — added 3 new tests for the Editar button + dialog open

**Created (e2e):**
- `e2e/tests/clientes/clientes-edit.spec.ts`
- `e2e/tests/api/clientes-update.api.spec.ts`

**Modified (e2e):**
- `e2e/pages/clientes.page.ts` — added `btnEditarCliente`, `toastUpdateSuccess`, `formError{Nombre,Nit,Telefono,Ciudad}` locators
