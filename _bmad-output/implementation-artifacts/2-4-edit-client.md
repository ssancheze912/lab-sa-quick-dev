# Story 2.4: Edit Client

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit any field of an existing client by opening a pre-filled form and saving my changes,
so that the client information stays up to date and is reflected immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail at `/clientes/:clienteId` (Story 2.2 `ClienteDetailView`), **When** the client detail card renders, **Then** an `"Editar"` button is visible in the detail card header next to the client `Nombre` (siesa-ui-kit `Button` — `type="outline"`, `aria-label="Editar cliente"`). Clicking it opens a modal dialog (shadcn/ui `Dialog` — same fallback approved by Story 2.3 because siesa-ui-kit does not export a generic form modal — see MasterCrud reference §Alternativas para escenarios no-CRUD) with the title `"Editar cliente"` and the reusable `ClienteForm` from Story 2.3, pre-filled with the CURRENT values of all four fields (`Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`) as they exist on the loaded `Cliente` object (FR6). Focus lands on the `Nombre` input on open (WCAG focus-management — same as Story 2.3).

2. **Given** the edit dialog is open with pre-filled values, **When** the user modifies one or more fields (leaving all four non-empty) and submits (clicks `Guardar` OR presses `Enter` inside any input), **Then** `PUT /api/v1/clientes/{id}` is fired with body `{ nombre, nit, telefono, ciudad }` (JSON, camelCase). The mutation hook `useUpdateCliente` invalidates BOTH `['clientes']` AND `['clientes', id]` on success (R-011 mitigation — the list refetches AND the currently-open detail view refetches), the dialog closes, and a success `toast.success('Cliente actualizado correctamente')` is shown (siesa-ui-kit `toast.success`). The updated values are reflected in the detail card AND the list row immediately without a manual reload (FR27, NFR2 <2s).

3. **Given** the user clears one or more required fields (empty string or whitespace-only) and submits, **When** React Hook Form runs its Zod-based validation against the SAME `clienteSchema` introduced by Story 2.3, **Then** the request is **NOT** sent to the backend (MSW handler call count === 0), inline error messages appear under each empty field via `aria-describedby` binding a `role="alert"` node with the exact Spanish copy per field:
   - Nombre → `"El nombre es obligatorio"`
   - NIT/RUC → `"El NIT/RUC es obligatorio"`
   - Teléfono → `"El teléfono es obligatorio"`
   - Ciudad → `"La ciudad es obligatoria"`
   Errors surface on the FIRST submit attempt (`mode: 'onSubmit'`) and update in real time thereafter (`reValidateMode: 'onChange'`). The `Guardar` button stays enabled during validation — no "dead button" anti-pattern (same discipline as Story 2.3).

4. **Given** the user clicks `Cancelar` OR presses `Escape` OR clicks the dialog overlay (before submitting), **When** the dialog closes, **Then** the form state is discarded (`reset()` on unmount), NO `PUT` request is fired, the underlying `Cliente` remains unchanged on the server AND in the TanStack Query cache, the detail card continues to show the ORIGINAL values, and re-opening the dialog shows the form pre-filled again with the same original values (no stale in-flight edits leak between opens).

5. **Given** the user submits a form whose `nit` value collides with a DIFFERENT existing client (someone else already registered that NIT/RUC), **When** the backend returns `409 Conflict` with a Problem Details RFC 7807 body containing `title="Conflict"` and `detail="El NIT/RUC ya está registrado"`, **Then** the frontend surfaces the exact Spanish copy `"El NIT/RUC ya está registrado"` as an inline error under the `NIT/RUC` field (NOT as a toast — per-field per-input, same convention as Story 2.3), the dialog stays open with the user's edits preserved, the `Guardar` button re-enables, and the raw backend error body is NEVER exposed (NFR6). No `stackTrace`, `exception`, or `error.message` string is ever rendered to the DOM.

6. **Given** the user submits a form whose `nit` is the SAME as the currently-edited client's own current NIT (i.e. the user did not change NIT — or changed it and then changed it back), **When** the backend runs the uniqueness check, **Then** the request MUST succeed (`200 OK`) even though a row with that NIT exists — the row IS the entity being updated. The application-level `NitExistsAsync` check MUST be excluded for the row being updated (see Task 3). This guards against the "cannot save because you didn't change NIT" bug that a naive `NitExistsAsync(nit)` would produce on every PUT.

7. **Given** the backend returns a non-409 non-2xx status (500, 503, network error) OR the endpoint returns `404` (the row was deleted by another user between load and save — race with Story 2.5), **When** the mutation settles with an error, **Then** the dialog stays open with the typed values preserved, an inline `Alert` (siesa-ui-kit `Alert` — same visual treatment Story 2.3 introduced with a `border border-red-500 bg-red-50 text-red-900` wrapper) appears at the top of the form body with:
   - For 404 → title `"El cliente ya no existe"`, subtitle `"Fue eliminado por otro usuario. Cierra el formulario para volver a la lista."`
   - For any other error → title `"No se pudo guardar"`, subtitle `"Comprueba tu conexión e intenta nuevamente."`
   The `Guardar` button re-enables so the user can retry (except in the 404 case — see Task 6 for the "close-to-return" UX). The raw error message is NEVER shown (NFR6).

8. **Given** the mutation is in flight (between click and settle), **When** the network round-trip is longer than one paint frame, **Then** the `Guardar` button shows `aria-busy="true"` and becomes `disabled`, the `Cancelar` button stays enabled, the four form inputs become read-only (`aria-readonly="true"` + `readOnly` prop) so the user cannot type-race the request, and the toast is NOT shown until the settle. This mirrors Story 2.3's in-flight discipline and is enforced by the SAME `ClienteForm` component (no new logic needed on the form itself — the dialog wrapper drives `isSubmitting`).

9. **Given** the backend endpoint `PUT /api/v1/clientes/{id:guid}` is deployed, **When** any client hits it with a well-formed `UpdateClienteRequest` body `{ nombre, nit, telefono, ciudad }` (all four non-null, non-empty strings, trimmed) whose `nit` either matches the target row's OWN `nit` OR does NOT exist on any other row, **Then** it returns HTTP `200 OK` with the FULL updated `ClienteDto` (matching the Story 2.1 shape: `{ id, nombre, nit, telefono, ciudad, createdAt, updatedAt }`) where `updatedAt` is a FRESH `DateTimeOffset.UtcNow` and `createdAt` is UNCHANGED (audit trail — the original creation timestamp is preserved). The row is persisted through `IClienteRepository.UpdateAsync(cliente, ct)` (Story 2.4 adds this method to the interface) inside the handler.

10. **Given** the request body is missing a required field (null, empty string, or whitespace-only), **When** the FluentValidation `UpdateClienteRequestValidator` runs during model binding (registered via the `ValidationEndpointFilter<UpdateClienteRequest>` from Story 2.3 — reused, generic), **Then** the endpoint returns HTTP `400 Bad Request` with a Problem Details body `{ type, title: "Validation Failed", status: 400, errors: { <field>: [<message>] } }`. The `errors` map keys are camelCase (`nombre`, `nit`, `telefono`, `ciudad`) and the values are Spanish messages that MATCH the Zod schema verbatim to satisfy R-006 (Zod ↔ FluentValidation parity):
    - `nombre` → `"El nombre es obligatorio"`
    - `nit` → `"El NIT/RUC es obligatorio"`
    - `telefono` → `"El teléfono es obligatorio"`
    - `ciudad` → `"La ciudad es obligatoria"`
    NO `stackTrace`, NO `exception` string, NO framework internals (NFR6, R-001).

11. **Given** the request's URL id does NOT correspond to any existing cliente, **When** the handler executes, **Then** it returns HTTP `404 Not Found` via `Results.NotFound()` (which `UseStatusCodePages` from Story 1.3 rewrites into a Problem Details RFC 7807 body). No unhandled `NullReferenceException`, no leaked entity type name — the response body includes `title`, `status` and `instance` only. This is the race-with-delete guard consumed by AC #7.

12. **Given** the request body's `nit` already exists in the database on a DIFFERENT row (an id different from the URL's `{id}`), **When** the handler executes, **Then** it detects the collision via `IClienteRepository.NitExistsForAnotherAsync(id, nit, ct)` BEFORE calling `UpdateAsync` (application-level check — same defence-in-depth as Story 2.3, avoids `DbUpdateException`, R-002). It throws `ClienteNitConflictException` (REUSES the Story 2.3 domain exception — DO NOT create a new subtype), which `ExceptionHandlingMiddleware` translates into HTTP `409 Conflict` with the same RFC 7807 body: `{ type, title: "Conflict", status: 409, detail: "El NIT/RUC ya está registrado", instance }`. NO `stackTrace`, NO `exception`, NO SQL internals (NFR6 anti-leak). The DB unique index `uk_clientes_nit` (Story 2.1) remains the second-line defence.

13. **Given** `dotnet build backend/SiesaAgents.sln` and `pnpm --dir frontend build && pnpm --dir frontend typecheck` are executed, **When** both toolchains compile, **Then** backend build reports 0 errors / 0 new warnings (the pre-existing `NU1903` suppression from Story 1.1 stays), frontend build succeeds under TypeScript strict mode with 0 errors and NO `any` types are introduced. The frontend CSS gzip must not regress by more than +4 KB versus the Story 2.3 baseline (670.26 KB) — this story reuses the Story 2.3 dialog + toast infrastructure and only adds a small edit mutation hook + a button.

14. **Given** `dotnet test backend/SiesaAgents.sln` and `pnpm --dir frontend test` are executed, **When** all tests run, **Then** every existing test from Stories 1.1/1.2/1.3/2.1/2.2/2.3 continues to pass AND the new tests introduced by this story pass — see the enumerated test list under "Testing Standards" below. Coverage of net-new files under `modules/crm/clientes/**` and `SiesaAgents.Application/Clientes/Commands/**` + `Validators/**` is `> 80%` (company standard).

## Tasks / Subtasks

- [ ] Task 1 — Backend Domain layer: `UpdateAsync` + `NitExistsForAnotherAsync` on `IClienteRepository` (AC: #9, #12)
  - [ ] Edit `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`:
    - Add `Task UpdateAsync(ClienteEntity cliente, CancellationToken ct);` (returns `Task` — EF Core mutates the entity in-place; the caller holds the reference).
    - Add `Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct);` — TRUE only when a row with the given `nit` exists whose `Id != id`. This is the "unique-excluding-self" check that AC #6 depends on.
    - Do NOT declare `DeleteAsync` — Story 2.5.
    - Update the XML doc comment on the interface to mention that Story 2.4 introduces `UpdateAsync` + `NitExistsForAnotherAsync`.
  - [ ] Add a domain-level entity mutation method to `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`:
    ```csharp
    public void Update(string nombre, string nit, string telefono, string ciudad)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(nit);
        ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
        ArgumentException.ThrowIfNullOrWhiteSpace(ciudad);

        Nombre = nombre;
        Nit = nit;
        Telefono = telefono;
        Ciudad = ciudad;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
    ```
    - Domain-level mutation kept co-located with `Create(...)` — the entity remains the single source of truth for its own invariants (DDD).
    - `CreatedAt` MUST NOT be touched — audit-trail immutability (AC #9).
    - `UpdatedAt` is refreshed to `DateTimeOffset.UtcNow` on every call (per company standards — `DateTimeOffset`, never `DateTime`).
    - Same null / whitespace guards as `Create(...)` — the application layer catches this via FluentValidation before it reaches the entity, but the entity stays defensive so unit tests can exercise the domain in isolation.

- [ ] Task 2 — Backend Infrastructure: `ClienteRepository.UpdateAsync` + `NitExistsForAnotherAsync` (AC: #9, #12)
  - [ ] Edit `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`:
    ```csharp
    public async Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
    {
        _db.Clientes.Update(cliente);
        await _db.SaveChangesAsync(ct);
    }

    public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct)
    {
        return _db.Clientes
            .AsNoTracking()
            .AnyAsync(c => c.Nit == nit && c.Id != id, ct);
    }
    ```
    - `Update(...)` on the DbSet attaches the (detached) entity as `Modified` — the handler works with an entity loaded via `GetByIdAsync` (which uses `AsNoTracking`) so we MUST re-attach here. `SaveChangesAsync` persists the write. This matches Story 2.3's `AddAsync` shape (write goes through the repo, handler stays free of EF plumbing).
    - `NitExistsForAnotherAsync` uses `AsNoTracking()` + `AnyAsync` (translates to `EXISTS (SELECT 1 ...)` — cheaper than `Count > 0`). The `c.Id != id` clause is the exclude-self guard.
    - Do NOT wrap in a transaction — Story 2.3's convention.
    - Do NOT change `ClienteConfiguration.cs` — the `uk_clientes_nit` unique index from Story 2.1 stays as the DB-level defence.

- [ ] Task 3 — Backend Application layer: `UpdateClienteRequest` + `UpdateClienteCommand` + Handler + Validator (AC: #9, #10, #11, #12)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs`:
    ```csharp
    namespace SiesaAgents.Application.Clientes.DTOs;

    /// <summary>
    /// Request DTO for PUT /api/v1/clientes/{id} (Story 2.4).
    /// Structurally identical to <see cref="CreateClienteRequest"/> — kept as
    /// a distinct type so validators + endpoint filters compose independently
    /// (matches the architecture doc §Complete Project Directory Structure).
    /// </summary>
    public sealed record UpdateClienteRequest(
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad);
    ```
    - Same shape as `CreateClienteRequest`. Kept as a separate record because the architecture doc lists both under `Clientes/DTOs/` and because Story 2.6+ or later features may diverge them (`CreatedAt` is not editable but a future refactor may want it in the response).
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`:
    ```csharp
    using SiesaAgents.Application.Clientes.DTOs;

    namespace SiesaAgents.Application.Clientes.Commands;

    public sealed record UpdateClienteCommand(Guid Id, UpdateClienteRequest Request);
    ```
    - Wraps the id + request DTO so the handler signature is symmetric with Story 2.3's `CreateClienteCommand`.
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`:
    ```csharp
    using SiesaAgents.Application.Clientes.DTOs;
    using SiesaAgents.Domain.Clientes.Exceptions;
    using SiesaAgents.Domain.Clientes.Interfaces;

    namespace SiesaAgents.Application.Clientes.Commands;

    /// <summary>
    /// Application-layer handler for <see cref="UpdateClienteCommand"/> (Story 2.4).
    ///
    /// Runs the "unique-NIT-excluding-self" check BEFORE mutating the entity
    /// (defence-in-depth against races — the DB unique index remains as a
    /// second line of defence). Returns null when the row does not exist so
    /// the endpoint can translate that to 404 (AC #11).
    /// </summary>
    public sealed class UpdateClienteCommandHandler
    {
        private readonly IClienteRepository _repository;

        public UpdateClienteCommandHandler(IClienteRepository repository)
        {
            _repository = repository;
        }

        public async Task<ClienteDto?> HandleAsync(UpdateClienteCommand command, CancellationToken ct)
        {
            var request = command.Request;

            var entity = await _repository.GetByIdAsync(command.Id, ct);
            if (entity is null)
            {
                return null; // Endpoint maps to 404.
            }

            if (await _repository.NitExistsForAnotherAsync(command.Id, request.Nit, ct))
            {
                throw new ClienteNitConflictException(request.Nit);
            }

            entity.Update(request.Nombre, request.Nit, request.Telefono, request.Ciudad);
            await _repository.UpdateAsync(entity, ct);

            return new ClienteDto(
                entity.Id,
                entity.Nombre,
                entity.Nit,
                entity.Telefono,
                entity.Ciudad,
                entity.CreatedAt,
                entity.UpdatedAt);
        }
    }
    ```
    - Direct handler (no MediatR) — matches Stories 2.1/2.2/2.3.
    - REUSES `ClienteNitConflictException` (Story 2.3) — do NOT create a new exception type. The middleware branch already handles it.
    - REUSES `entity.Update(...)` — the entity is the source of truth for its own mutations and `UpdatedAt`.
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs`:
    ```csharp
    using FluentValidation;
    using SiesaAgents.Application.Clientes.DTOs;

    namespace SiesaAgents.Application.Clientes.Validators;

    public sealed class UpdateClienteRequestValidator : AbstractValidator<UpdateClienteRequest>
    {
        public UpdateClienteRequestValidator()
        {
            RuleFor(x => x.Nombre).NotEmpty().WithMessage("El nombre es obligatorio");
            RuleFor(x => x.Nit).NotEmpty().WithMessage("El NIT/RUC es obligatorio");
            RuleFor(x => x.Telefono).NotEmpty().WithMessage("El teléfono es obligatorio");
            RuleFor(x => x.Ciudad).NotEmpty().WithMessage("La ciudad es obligatoria");
        }
    }
    ```
    - Messages MUST match the Zod schema strings VERBATIM (AC #3, #10, R-006). They also match `CreateClienteRequestValidator` (Story 2.3) — deliberate: same required-fields contract.
    - `NotEmpty()` rejects null, empty string, AND whitespace-only (default behaviour) — matches Zod `.trim().min(1)`.
    - Story 2.4 introduces ONLY presence rules — same P0 scope as Story 2.3. Format validators (NIT charset, phone regex) remain deferred.
  - [ ] Register DI in `backend/src/SiesaAgents.API/Program.cs`, near the existing `AddScoped<CreateClienteCommandHandler>()` line:
    ```csharp
    // Story 2.4 — Cliente edit
    builder.Services.AddScoped<UpdateClienteCommandHandler>();
    ```
    - The FluentValidation `AddValidatorsFromAssemblyContaining<CreateClienteRequestValidator>()` (Story 2.3) already picks up the new `UpdateClienteRequestValidator` because it lives in the SAME assembly — NO additional FluentValidation wiring needed. Verify by checking `Program.cs` has the assembly-scan line; if not, this task fails Story 2.4's contract.

- [ ] Task 4 — Backend API: `PUT /api/v1/clientes/{id:guid}` (AC: #9, #10, #11, #12)
  - [ ] Edit `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — add the `PUT` endpoint inside the same `MapGroup("/api/v1/clientes")` group, AFTER the Story 2.3 `MapPost` block:
    ```csharp
    // Story 2.4 — PUT /api/v1/clientes/{id:guid}.
    // ValidationEndpointFilter (Story 2.3 generic filter) runs BEFORE the
    // handler; a 400 short-circuits. On 409 the handler throws
    // ClienteNitConflictException and the ExceptionHandlingMiddleware
    // translates it to Problem Details. On 404 the handler returns null and
    // the endpoint calls Results.NotFound() (UseStatusCodePages rewrites the
    // empty body into RFC 7807).
    group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateClienteRequest request,
            UpdateClienteCommandHandler handler,
            CancellationToken ct) =>
        {
            var dto = await handler.HandleAsync(new UpdateClienteCommand(id, request), ct);
            return dto is null ? Results.NotFound() : Results.Ok(dto);
        })
        .AddEndpointFilter<ValidationEndpointFilter<UpdateClienteRequest>>()
        .WithName("UpdateCliente")
        .Produces<ClienteDto>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    ```
    - Route constraint `:guid` short-circuits any non-UUID path with 404 (same as Story 2.2 `GET /{id:guid}`).
    - `AddEndpointFilter<ValidationEndpointFilter<UpdateClienteRequest>>()` reuses the Story 2.3 generic filter — no new class needed. The DI container resolves `IValidator<UpdateClienteRequest>` via the assembly scan.
    - No middleware changes needed — the 409 branch already exists in `ExceptionHandlingMiddleware` (Story 2.3), and `UseStatusCodePages` (Story 1.3) already rewrites empty 404 into RFC 7807.

- [ ] Task 5 — Backend tests: unit + endpoint + validator (AC: #9, #10, #11, #12, #14)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`:
    - `HandleAsync_UpdatesEntity_AndReturnsDto_WhenIdExists_AndNitIsUniqueOrSelf` — fake repo returns an existing entity for `GetByIdAsync` and `false` for `NitExistsForAnotherAsync`; assert `UpdateAsync` called once with the SAME entity reference (identity check); assert returned DTO has `Id === input.Id`, `Nombre/Nit/Telefono/Ciudad === request values`, `UpdatedAt > CreatedAt`, and `CreatedAt` UNCHANGED versus the seed value (audit-trail immutability).
    - `HandleAsync_ReturnsNull_WhenIdDoesNotExist` — fake repo returns `null` for `GetByIdAsync`; assert handler returns `null` and `UpdateAsync` never called; assert `NitExistsForAnotherAsync` also never called (short-circuit).
    - `HandleAsync_ThrowsClienteNitConflictException_WhenNitCollidesWithAnotherRow` — fake repo returns an entity for `GetByIdAsync` and `true` for `NitExistsForAnotherAsync`; assert `ClienteNitConflictException` is thrown with `.Nit` matching the request; assert `UpdateAsync` is NEVER called.
    - `HandleAsync_AllowsSameNit_WhenItBelongsToTheSameRow` — fake repo returns an entity with `Nit = "900"` and returns `false` for `NitExistsForAnotherAsync(id, "900")` (the fake respects the exclude-self semantics); assert handler succeeds (200-path). This is the AC #6 anchor.
    - `HandleAsync_PassesRequestValues_ToEntityMutator` — assert the entity's post-mutation fields equal the request values; asserts the mapping seam that R-006 relies on.
    - Use raw xUnit `Assert.*` (no FluentAssertions — company convention).
    - Reuse the `FakeClienteRepository` pattern from Story 2.3 — extend the in-line fake in `ClienteEndpointsTests.cs` with `UpdateAsync` + `NitExistsForAnotherAsync` (counters + a boolean flag to simulate the "another-row collision" case).
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteRequestValidatorTests.cs`:
    - `Validate_Passes_WhenAllFieldsPresent` — happy-path DTO passes.
    - For each of `Nombre`, `Nit`, `Telefono`, `Ciudad`: one test with `null`, one with `""`, one with `"   "` — assert each produces exactly one error whose message matches the Spanish string. This is the R-006 parity anchor point.
    - IMPORTANT: These messages MUST be byte-for-byte identical to `CreateClienteRequestValidator`. Copy-paste the constants — do NOT introduce a shared string helper (the drift-anchor lives in the DUPLICATE — a shared helper would defeat the parity check).
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsUpdateTests.cs`:
    - Reuse the `WebApplicationFactory<Program>` + `.UseEnvironment("Testing")` + fake-repo-override pattern established by Stories 2.1/2.2/2.3.
    - `UpdateCliente_Returns200_WithFullDto_WhenBodyIsValid` — seed the fake with a cliente; PUT `/api/v1/clientes/{id}` with a body that changes `nombre`; assert `200`, `Content-Type` starts with `application/json`, body's `id` equals the URL id, body's `nombre` equals the new value, body's `createdAt` equals the seeded value, body's `updatedAt > createdAt`.
    - `UpdateCliente_Returns400_WithValidationProblem_WhenBodyIsIncomplete` — PUT with `{ nombre:"", nit:"", telefono:"", ciudad:"" }`; assert `400`, `Content-Type` starts with `application/problem+json`, body's `errors` map has EXACTLY the four keys `nombre`, `nit`, `telefono`, `ciudad` (camelCase), each carrying its Spanish message; body does NOT contain `"stackTrace"` or `"exception"` (NFR6).
    - `UpdateCliente_Returns400_WithSpecificField_WhenOnlyOneFieldMissing` — PUT with `{ nombre:"Ok", nit:"", telefono:"Ok", ciudad:"Ok" }`; assert `400`, `errors.nit === ["El NIT/RUC es obligatorio"]`, `errors.nombre` unset.
    - `UpdateCliente_Returns404_WithProblemDetails_WhenIdDoesNotExist` — PUT with a random Guid whose row is NOT seeded; assert `404`, `Content-Type` starts with `application/problem+json` (courtesy of `UseStatusCodePages`), body includes `title` and `status: 404`; body does NOT contain `"stackTrace"` or `"exception"`.
    - `UpdateCliente_Returns404_ForNonGuidPath` — PUT `/api/v1/clientes/not-a-guid`; assert `404` from routing itself (route constraint), NO Problem Details body needed (routing 404 is enough — same behaviour as Story 2.2 for GET).
    - `UpdateCliente_Returns409_WithProblemDetails_WhenNitCollidesWithAnotherRow` — seed the fake with TWO clientes (A with `nit="900"`, B with `nit="800"`); PUT `/api/v1/clientes/{A.Id}` with `nit:"800"`; assert `409`, `Content-Type` starts with `application/problem+json`, `title === "Conflict"`, `status === 409`, `detail === "El NIT/RUC ya está registrado"`; body does NOT contain `"stackTrace"`, `"exception"`, or the string `"NIT with"` (developer-facing exception message — must NOT leak); assert the fake repo's `UpdateAsync` counter is `0` (application-level check blocks the write).
    - `UpdateCliente_Returns200_WhenNitIsUnchanged` — seed with `nit="900"`; PUT `/api/v1/clientes/{id}` with `nit:"900"` (same); assert `200` — the exclude-self check must let this through (AC #6).
    - `UpdateCliente_PersistsRow_ThatIsThenVisibleOnGet` — seed with `nombre="Old"`; PUT to change `nombre="New"`; GET `/api/v1/clientes/{id}` (Story 2.2 endpoint); assert response body has `nombre="New"` and `updatedAt` matches the PUT response's `updatedAt`.
    - Coverage target: `> 80%` on all new backend files.
  - [ ] Extend `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddleware_NitConflictTests.cs` (Story 2.3 file):
    - Story 2.3 already asserts the middleware translates `ClienteNitConflictException` to 409 — no new test needed here. Verify the file still passes; do NOT modify it.
  - [ ] Verify: `dotnet test backend/SiesaAgents.sln` → all previous tests + the new ones pass. Coverage `> 80%` on new files.

- [ ] Task 6 — Frontend Application layer: `useUpdateCliente` mutation hook (AC: #2, #5, #6, #7, #8)
  - [ ] Edit `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — extend the interface with `update`:
    ```typescript
    update(id: string, payload: ClienteFormValues, signal?: AbortSignal): Promise<Cliente>
    ```
    - Place immediately after `create`.
    - Update the JSDoc: "Story 2.4 adds `update`."
  - [ ] Edit `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `update`:
    ```typescript
    async update(id: string, payload: ClienteFormValues, signal) {
      const { data } = await apiClient.put<Cliente>(
        `/api/v1/clientes/${encodeURIComponent(id)}`,
        payload,
        { signal },
      )
      return data
    },
    ```
    - `encodeURIComponent(id)` mirrors `getById` (Story 2.2) — defensive against edge inputs, even though the router constrains ids to UUIDs upstream.
  - [ ] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`:
    ```typescript
    import { useMutation, useQueryClient } from '@tanstack/react-query'
    import { toast } from 'siesa-ui-kit'
    import { AxiosError } from 'axios'
    import type { Cliente } from '../domain/Cliente'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
    import { CLIENTES_QUERY_KEY } from './useClientes'
    import type { ClienteFormValues } from './clienteSchema'

    /**
     * Classified mutation error for edit (Story 2.4). Extends the Story 2.3
     * `CreateClienteError` shape with a fourth kind (`not-found`) that the form
     * shell renders as a top-of-form alert with a distinct copy — the user's
     * only recourse is to close the dialog (the row is gone).
     */
    export interface UpdateClienteError {
      /**
       * - `nit-conflict` → backend returned 409 (duplicate NIT on another row)
       * - `not-found`    → backend returned 404 (row was deleted by another user)
       * - `validation`   → backend returned 400 (Zod bypass — defense-in-depth)
       * - `network`      → any other failure (500, offline, aborted)
       */
      kind: 'nit-conflict' | 'not-found' | 'validation' | 'network'
      nitMessage?: string
      generic?: { title: string; subtitle: string }
    }

    export interface UpdateClienteVariables {
      id: string
      values: ClienteFormValues
    }

    /**
     * Mutation hook for PUT /api/v1/clientes/{id} (Story 2.4).
     *
     * On success:
     *   - invalidates ['clientes'] AND ['clientes', id] (R-011 — both the list
     *     and the currently-open detail view refetch)
     *   - fires the success toast in Spanish
     *
     * On error the hook classifies the failure so the form component can decide
     * inline-field vs. top-of-form alerting (AC #5 vs. #7). The raw axios error
     * is NEVER surfaced (NFR6 / R-001 anti-leak).
     */
    export function useUpdateCliente() {
      const queryClient = useQueryClient()
      return useMutation<Cliente, UpdateClienteError, UpdateClienteVariables>({
        mutationFn: async ({ id, values }) => {
          try {
            return await clienteApiRepository.update(id, values)
          } catch (rawError) {
            throw classifyUpdateError(rawError)
          }
        },
        retry: 0,
        onSuccess: (_data, variables) => {
          queryClient.invalidateQueries({ queryKey: CLIENTES_QUERY_KEY })
          queryClient.invalidateQueries({ queryKey: [...CLIENTES_QUERY_KEY, variables.id] })
          toast.success('Cliente actualizado correctamente')
        },
      })
    }

    function classifyUpdateError(rawError: unknown): UpdateClienteError {
      if (rawError instanceof AxiosError) {
        const status = rawError.response?.status
        if (status === 409) {
          return { kind: 'nit-conflict', nitMessage: 'El NIT/RUC ya está registrado' }
        }
        if (status === 404) {
          return {
            kind: 'not-found',
            generic: {
              title: 'El cliente ya no existe',
              subtitle: 'Fue eliminado por otro usuario. Cierra el formulario para volver a la lista.',
            },
          }
        }
        if (status === 400) {
          return {
            kind: 'validation',
            generic: {
              title: 'No se pudo guardar',
              subtitle: 'Comprueba los datos e intenta nuevamente.',
            },
          }
        }
      }
      return {
        kind: 'network',
        generic: {
          title: 'No se pudo guardar',
          subtitle: 'Comprueba tu conexión e intenta nuevamente.',
        },
      }
    }
    ```
    - Same anti-leak discipline as Story 2.3: NEVER reads `error.message`, always classifies into a shape the form can consume.
    - `retry: 0` — no auto-retry (a 409/400/404 would loop).
    - The invalidation set is `['clientes']` + `['clientes', id]` — the second key is what `useCliente` (Story 2.2) is subscribed to for the detail view refetch.
    - The `not-found` kind is Story 2.4-specific — Story 2.3's Create hook does not need it because you cannot 404 on a row you have not created yet.
  - [ ] Colocate `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts`:
    - Test — success path: MSW returns 200 + updated DTO; assert the mutation resolves, `queryClient.invalidateQueries` is called TWICE (once with `['clientes']`, once with `['clientes', id]`), `toast.success` is called with `"Cliente actualizado correctamente"` (mock siesa-ui-kit `toast` via `vi.hoisted` — same pattern as Story 2.3's `useCreateCliente.test.ts`).
    - Test — 409 classification: MSW returns 409 with the Problem Details body; assert `UpdateClienteError` shape (`kind: 'nit-conflict'`, `nitMessage: 'El NIT/RUC ya está registrado'`); assert `toast.success` NOT called; assert invalidation NOT called.
    - Test — 404 classification: MSW returns 404; assert `kind: 'not-found'`, `generic.title === 'El cliente ya no existe'`, `generic.subtitle` contains the Spanish "cerrar el formulario" copy.
    - Test — 400 classification: MSW returns 400; assert `kind: 'validation'`.
    - Test — 500 classification: MSW returns 500; assert `kind: 'network'`, `generic.title === 'No se pudo guardar'`.

- [ ] Task 7 — Frontend Presentation: `ClienteEditDialog` + `ClienteForm` reuse + inline `Editar` button (AC: #1, #2, #4, #5, #7, #8)
  - [ ] Extend `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` to accept a WIDER `submitError` prop:
    - Currently the `submitError` prop is typed as `CreateClienteError | null`. Story 2.4 needs to also accept `UpdateClienteError`. Change the prop typing to a UNION of the two error shapes:
      ```typescript
      import type { CreateClienteError } from '../application/useCreateCliente'
      import type { UpdateClienteError } from '../application/useUpdateCliente'

      export type ClienteFormSubmitError = CreateClienteError | UpdateClienteError

      export interface ClienteFormProps {
        // ...
        submitError: ClienteFormSubmitError | null
      }
      ```
    - The rendering logic already branches on `submitError.kind`. Extend the `showGenericAlert` check to include `'not-found'`:
      ```typescript
      const showGenericAlert =
        submitError !== null &&
        (submitError.kind === 'network' ||
         submitError.kind === 'validation' ||
         submitError.kind === 'not-found')
      ```
    - The `nitBackendError` branch (`kind === 'nit-conflict'`) stays unchanged.
    - This is a non-breaking widening — Story 2.3's `ClienteFormDialog` still passes a `CreateClienteError` and the union accepts it. Update the `ClienteForm.test.tsx` types if they narrow the prop type manually.
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteEditDialog.tsx`:
    ```tsx
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
    } from '@/shared/components/ui/dialog'
    import { ClienteForm } from './ClienteForm'
    import { useUpdateCliente } from '../application/useUpdateCliente'
    import type { ClienteFormValues } from '../application/clienteSchema'
    import type { Cliente } from '../domain/Cliente'

    export interface ClienteEditDialogProps {
      open: boolean
      onOpenChange: (open: boolean) => void
      /** The current cliente being edited — pre-fills the form. */
      cliente: Cliente
    }

    /**
     * Modal shell that wires the reusable `ClienteForm` (Story 2.3) to the
     * `useUpdateCliente` mutation. Pre-fills the form with the current cliente
     * values (AC #1). On success invalidates both cache keys and closes; on
     * 409 / 404 / 500 the dialog stays open and lets the form surface the
     * error inline / at the top.
     */
    export function ClienteEditDialog({ open, onOpenChange, cliente }: ClienteEditDialogProps) {
      const mutation = useUpdateCliente()

      const handleSubmit = (values: ClienteFormValues) => {
        mutation.mutate(
          { id: cliente.id, values },
          {
            onSuccess: () => {
              mutation.reset()
              onOpenChange(false)
            },
          },
        )
      }

      const handleCancel = () => {
        if (mutation.isPending) return
        mutation.reset()
        onOpenChange(false)
      }

      const submitError = mutation.error ?? null

      return (
        <Dialog
          open={open}
          onOpenChange={(next) => {
            if (!next && mutation.isPending) return
            if (!next) mutation.reset()
            onOpenChange(next)
          }}
        >
          <DialogContent aria-describedby={undefined} data-testid="cliente-edit-dialog">
            <DialogHeader>
              <DialogTitle>Editar cliente</DialogTitle>
            </DialogHeader>
            <ClienteForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={mutation.isPending}
              submitError={submitError}
              defaultValues={{
                nombre: cliente.nombre,
                nit: cliente.nit,
                telefono: cliente.telefono,
                ciudad: cliente.ciudad,
              }}
            />
          </DialogContent>
        </Dialog>
      )
    }
    ```
    - Mirrors Story 2.3's `ClienteFormDialog` — the shell is a thin adapter around the mutation + form. The `defaultValues` prop (added by Story 2.3 as an extension point) is what pre-fills the form.
    - `data-testid="cliente-edit-dialog"` is distinct from `cliente-form-dialog` (Story 2.3) — tests can disambiguate.
    - `handleCancel` + Escape / overlay routes gated by `mutation.isPending` (AC #4, #8).
  - [ ] Edit `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
    - Import `useState` from React + `ClienteEditDialog`.
    - Inside `ClienteDetailCard`, add local state `const [editOpen, setEditOpen] = useState(false)`.
    - Add an `"Editar"` button inside the `<header>`, positioned to the right of `<h2>`:
      ```tsx
      <header className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {cliente.nombre}
        </h2>
        <Button
          type="outline"
          onClick={() => setEditOpen(true)}
          aria-label="Editar cliente"
          data-testid="cliente-detail-edit"
        >
          Editar
        </Button>
      </header>
      ```
    - Render `<ClienteEditDialog open={editOpen} onOpenChange={setEditOpen} cliente={cliente} />` at the bottom of the `<article>`.
    - Import `Button` from `siesa-ui-kit` (same pattern as `ClienteListView`).
    - Do NOT modify the loading / error / not-found branches — only the successful `ClienteDetailCard` sub-component.
    - Do NOT change the `<article>` styling; only the header layout gains the flex wrapper.
  - [ ] Colocate `frontend/src/modules/crm/clientes/presentation/ClienteEditDialog.test.tsx`:
    - Test 1 — closed dialog does not render form (`data-testid="cliente-form"` not in DOM when `open=false`).
    - Test 2 — open dialog: dialog title `"Editar cliente"` visible; four inputs pre-filled with the passed `cliente` values (`getByDisplayValue`); Guardar + Cancelar visible.
    - Test 3 — Cancel button calls `onOpenChange(false)`.
    - Test 4 — 200 path: MSW returns 200 with updated DTO → after submit the dialog closes (`onOpenChange(false)` observed) AND `queryClient.invalidateQueries` was called BOTH with `['clientes']` and `['clientes', id]` AND toast.success called with `"Cliente actualizado correctamente"`.
    - Test 5 — 409 path: MSW returns 409 → the dialog stays open, the NIT inline error shows the Spanish string, `onOpenChange` NOT called, toast.success NOT called.
    - Test 6 — 404 path: MSW returns 404 → the top-of-form alert appears with title `"El cliente ya no existe"` and the "Cierra el formulario" subtitle; `onOpenChange` NOT called, toast.success NOT called.
    - Test 7 — 500 path: MSW returns 500 → the top-of-form alert appears with `"No se pudo guardar"`, `onOpenChange` NOT called, toast.success NOT called.
    - Test 8 — cancellation during in-flight submit: MSW delayed 200ms; click Guardar then click Cancelar → the mutation is gated (`handleCancel` early-return) and no dialog close is triggered.
    - Test 9 — pre-fill is fresh on re-open: pass `cliente="A"` → user edits Nombre to `"X"` → clicks Cancelar → dialog closes → parent re-opens with a NEW `cliente="B"` → assert the form shows `B.nombre`, NOT `"X"`.
  - [ ] Colocate `frontend/src/modules/crm/clientes/presentation/ClienteEditDialog.edge.test.tsx`:
    - Test — required-field errors on edit: open dialog, CLEAR the Nombre field, click Guardar → assert `"El nombre es obligatorio"` error appears; assert `PUT` call count === 0 (MSW handler spy).
    - Test — real-time re-validation: clear Nombre, click Guardar (error appears), type into Nombre → error clears (`reValidateMode: 'onChange'`).
    - Test — same-NIT round trip (AC #6): pre-fill with `nit="900"`, DO NOT change NIT, edit only `nombre`, submit → MSW returns 200 → assert dialog closes (server-side exclude-self check is tested in backend tests; this UI test just proves the FE does not add its own client-side "NIT unchanged" barrier).

- [ ] Task 8 — Frontend integration + tests (AC: #1, #2, #4, #5, #14)
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`:
    - Story 2.2's happy-path test asserts `NIT/RUC`, `Teléfono`, `Ciudad` render. Add a new test #N:
      ```
      Test N — Editar button visible with aria-label "Editar cliente"; clicking it opens the edit dialog (assert getByRole('dialog') visible with title "Editar cliente").
      ```
    - Do NOT delete unrelated tests. Story 2.2 skeleton / 404 / ErrorPanel tests stay.
    - If Story 2.2's tests use MSW, extend the handler set to stub `PUT /api/v1/clientes/{id}` returning 200 with the same seed row so the dialog does not error on submit paths exercised by other tests.
  - [ ] Add `frontend/src/routes/clientes.edit.test.tsx` — routing-integration test that renders the router at `/clientes/:clienteId` with MSW handlers, clicks the `"Editar"` button, edits fields, submits, and asserts:
    - The dialog opens with pre-filled values.
    - The dialog's title is exactly `"Editar cliente"`.
    - After MSW returns 200, the dialog closes AND the detail card re-renders with the new values (the invalidation-triggered refetch re-serves the updated DTO).
    - Toast success is called with `"Cliente actualizado correctamente"`.
    - Reuse the router-provider helper used by `clientes.$clienteId.test.tsx` (Story 2.2) and `clientes.create.test.tsx` (Story 2.3). Do NOT introduce a new abstraction.
  - [ ] Add duplicate-NIT integration test in the same routing file:
    - MSW handler for `PUT /api/v1/clientes/{id}` returns 409 with the RFC 7807 body once, then 200 on the second PUT.
    - First submit → assert inline NIT error appears in the DOM with the exact Spanish string; assert the dialog stays open; assert the toast is NOT called.
    - User edits the NIT and re-submits → 200 → dialog closes.
  - [ ] Add not-found integration test in the same file:
    - MSW handler for `PUT /api/v1/clientes/{id}` returns 404.
    - Submit → assert the top-of-form alert with `"El cliente ya no existe"` appears; dialog stays open; toast NOT called.
  - [ ] Playwright E2E — add `e2e/tests/clientes/story-2-4-edit-client.spec.ts`:
    - Uses `page.route('**/api/v1/clientes/**', ...)` to stub GET + PUT responses.
    - Scenario 1 (P0, R-011): navigate to `/clientes/:id` → click `"Editar"` → change Nombre → submit → assert the detail card shows the new Nombre; assert the list row shows the new Nombre (both without a page reload); assert the success toast contains `"Cliente actualizado correctamente"`.
    - Scenario 2 (P0, R-002): submit with a NIT that the stubbed PUT returns 409 for → assert the inline NIT error is `"El NIT/RUC ya está registrado"`; no toast; dialog stays open.
    - Scenario 3 (P0, R-001): assert the 409 response body preview does NOT contain the strings `stackTrace`, `exception`, `SqlException`, `NpgsqlException` (Playwright can read the fetch response body via `page.on('response')`).
    - Reuse the `resetDatabase` / seed helpers Stories 2.1 / 2.3 E2E introduced.

- [ ] Task 9 — Verification & wrap-up (AC: #13, #14)
  - [ ] `dotnet build backend/SiesaAgents.sln` → 0 errors / 0 new warnings (pre-existing NU1903 suppression stays).
  - [ ] `dotnet test backend/SiesaAgents.sln` → all tests pass (Story 1.x + 2.1 + 2.2 + 2.3 baseline + new 2.4 tests). Coverage `> 80%` on new backend files.
  - [ ] `pnpm --dir frontend typecheck` → 0 errors.
  - [ ] `pnpm --dir frontend test` → all tests pass (previous suites + new Story 2.4 tests). Coverage `> 80%` on new frontend files.
  - [ ] `pnpm --dir frontend build` → succeeds. CSS gzip does not regress by more than +4 KB vs. the Story 2.3 baseline (670.26 KB).
  - [ ] Manual smoke (developer local — optional): `dotnet run --project backend/src/SiesaAgents.API` + `pnpm --dir frontend dev`; open `http://localhost:5173/clientes/:id`, click `Editar`, change fields, submit, verify the detail and list update AND the toast displays.
  - [ ] Do NOT run `dotnet ef migrations add ...` — Story 2.4 introduces no new tables or columns.
  - [ ] Sprint-status update handled by workflow step-06 (this workflow, not by dev-story).

## Dev Notes

### Architecture Pattern (Clean Architecture — extending the Story 2.3 mutation slice)

Story 2.4 is the second Cliente mutation story and it consciously REUSES the Story 2.3 infrastructure end-to-end:

- **Backend Domain**: adds `IClienteRepository.UpdateAsync` + `NitExistsForAnotherAsync` + `ClienteEntity.Update(...)`. Reuses `ClienteNitConflictException` from Story 2.3.
- **Backend Application**: introduces the second Command + Handler (`UpdateClienteCommand` + `UpdateClienteCommandHandler`), the second Request DTO (`UpdateClienteRequest`) and the second FluentValidation validator (`UpdateClienteRequestValidator`).
- **Backend Infrastructure**: implements `UpdateAsync` + `NitExistsForAnotherAsync` on `ClienteRepository`.
- **Backend API**: adds `PUT /api/v1/clientes/{id:guid}` on the existing route group; REUSES `ValidationEndpointFilter<T>` (generic — Story 2.3 built it that way for exactly this purpose); NO changes to `ExceptionHandlingMiddleware` (409 branch already exists) and NO changes to `UseStatusCodePages` wiring (404 already handled).
- **Frontend Application**: adds `useUpdateCliente` mutation hook (mirrors `useCreateCliente` shape). REUSES the `clienteSchema` Zod contract from Story 2.3 verbatim.
- **Frontend Presentation**: adds `ClienteEditDialog` shell; REUSES the `ClienteForm` component from Story 2.3 (with a slight prop-type widening on `submitError` to accept the extended `UpdateClienteError` shape). Extends `ClienteDetailView` with an `"Editar"` button + local state.

**Explicit non-scope for this story:**

- No DELETE endpoint (Story 2.5).
- No optimistic UI — same as Story 2.3, we rely on the invalidation-triggered refetch. `R-005` (optimistic-rollback bug in the test design) does NOT apply here — Story 2.4 does not attempt an optimistic write.
- No auto-close on 404 (the alert prompts the user to close manually — a mid-form auto-close would lose their in-progress edits if their read of "el cliente ya no existe" is wrong).
- No format validation for NIT / phone / email — the AC only requires FR8 (required-field validation). Format rules stay deferred.
- No `SortControl` — Story 2.6.
- No `ContactManager` — Epic 3 / Story 4.1.
- No changes to the `clientes` table schema — the `uk_clientes_nit` unique index from Story 2.1 stays as-is.
- No new toast library — reuses siesa-ui-kit's `toast` API that Story 2.3 mounted at the app root.
- No new modal library — reuses shadcn/ui `Dialog` (already scaffolded).

### Tech Stack & Libraries (mandatory versions per company standards)

- **Backend**: .NET 10 · C# Minimal API · EF Core 10 · **FluentValidation** (already installed in `SiesaAgents.Application` + `SiesaAgents.API` via Story 2.3 — NO new package installations).
- **Frontend**: React 19 · TypeScript strict · TanStack Query 5.101+ (mutations) · React Hook Form 7.81+ + `@hookform/resolvers/zod` (already installed) · Zod 4.4+ (already installed) · siesa-ui-kit 1.0.256+ (`Alert`, `Button`, `Input`, `Toast`, `ToastProvider`, `toast`) · shadcn/ui `Dialog` (already scaffolded at `frontend/src/shared/components/ui/dialog.tsx`).
- **Package manager**: `pnpm` — never `npm install`, never `yarn`.
- **Do NOT add**: MediatR, FluentAssertions, `date-fns`, `lodash`, a competing Toast/Dialog library. If any of these appear in the diff during dev-story, they must be removed before merge.

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 — installed at `^1.0.256`).
- **Modal**: shadcn/ui `Dialog` (approved fallback — same rationale as Story 2.3; siesa-ui-kit does not export a generic form-container modal).
- **Toast**: siesa-ui-kit `Toast` + `ToastProvider` + `toast.success(...)`. The `ToastProvider` is already mounted in `main.tsx` (Story 2.3). Do NOT install a competing library.
- **Alert (top-of-form on 404 / network / validation)**: siesa-ui-kit `Alert` wrapped in the same `border border-red-500 bg-red-50 text-red-900` container Story 2.3 introduced. Consistency > invention.
- **Buttons**: siesa-ui-kit `Button` — `type="outline"` for both `Editar` (in the detail card header) and `Cancelar` (in the dialog); `type="default" color="primary"` for `Guardar`. The `Editar` button has `aria-label="Editar cliente"` for icon-only accessibility parity (even though the label is currently text; the aria-label protects screen readers if the visual label is later shortened).
- **Inputs**: siesa-ui-kit `Input`. Reuse the `ClienteForm` component — do NOT hand-roll inputs.
- **Icons**: no new icons required.
- **Spanish text**: every visible string, `aria-label`, `placeholder`, toast, error message is Spanish. Code (variables, functions, types) stays English.
- **ARIA rules from UX spec §Accessibility**:
  - Dialog root: shadcn `Dialog` already applies `role="dialog"` + `aria-modal="true"`; the `DialogTitle` `"Editar cliente"` supplies the accessible name.
  - Form errors: each error node has `role="alert"` and is bound to its input via `aria-describedby` (already true in `ClienteForm` — no changes needed).
  - Submit-in-progress: Guardar button has `aria-busy="true"`; inputs have `readOnly` (via the existing `ClienteForm` logic — no changes needed).
  - Focus management: focus lands on Nombre on dialog open (`autoFocus` on the first Field — already implemented by `ClienteForm`). shadcn `Dialog` handles focus-trap and Escape-to-close.
  - `Editar` button: 44px touch target (siesa-ui-kit `Button` default), keyboard-focusable (default), `aria-label="Editar cliente"`.

### MasterCrud enforcement — DEFERRED (extends Story 2.1/2.2/2.3 rationale)

Story 2.4 preserves the deferral chain established by Stories 2.1/2.2/2.3:

1. Story 2.4 introduces an **edit form** in a **modal dialog** — the same shape MasterCrud rejects (server pagination + table-first + `IServiceAdapter` shape misalign with the split-panel + detail card composition prescribed by the architecture doc).
2. MasterCrud's `CrudService<T>` would require re-plumbing `clienteApiRepository` + TanStack Query cache seams that Stories 2.1/2.2/2.3 baked in.
3. No `activeByCompany`, `companies`, `formColumns`, `lookupConfig` semantics are needed — Cliente is still a flat 4-field entity.

If a later epic adds a multi-company or tabular entity, MasterCrud becomes the natural fit for THAT screen. Not for Cliente CRUD in Epic 2.

This deviation is authorised by the architecture doc + Story 2.1/2.2/2.3 Change Logs; add it to Story 2.4's Change Log too if `sa-code-review` re-flags it.

### Backend Critical Rules (per company standards)

- **UUID PK**: unchanged — `ClienteEntity.Update` never touches `Id`.
- **`DateTimeOffset`** only — `entity.Update(...)` sets `UpdatedAt` to `DateTimeOffset.UtcNow` and MUST NOT touch `CreatedAt` (audit-trail immutability, AC #9).
- **snake_case naming** — automatic via `UseSnakeCaseNamingConvention()`. No new config touchpoints.
- **Scalar** for API docs — the new `PUT` endpoint inherits the `Clientes` tag from the route group.
- **Problem Details RFC 7807** — 400s come from `Results.ValidationProblem` (via the existing `ValidationEndpointFilter<T>`), 409 from the existing middleware branch, 404 from `Results.NotFound()` rewritten by `UseStatusCodePages` (Story 1.3), all other 5xx from the existing `ExceptionHandlingMiddleware`. Do NOT return raw exception messages anywhere. Do NOT include `stackTrace` / `exception` keys — the tests assert this negatively (NFR6, R-001).
- **CQRS**: reads use Queries (Stories 2.1/2.2), writes use Commands (Story 2.3 for Create, Story 2.4 for Update). Direct handlers, no MediatR.
- **`AddValidatorsFromAssemblyContaining`** (Story 2.3) picks up `UpdateClienteRequestValidator` automatically — the assembly scan is the WHOLE reason this DI helper was chosen in Story 2.3.

### Frontend Critical Rules (per company standards)

- **Zustand: NOT USED** — dialog open/close is local `useState` (co-located with `ClienteDetailCard`); form state is React Hook Form (component-level); server state is TanStack Query. Zustand is reserved for cross-route ephemeral state, which does not exist here.
- **TanStack Query keys** — Story 2.4 MUST invalidate BOTH `['clientes']` AND `['clientes', id]` on success. The second key is what `useCliente` (Story 2.2) is subscribed to for the detail view refetch. Missing the second invalidation would produce a "stale detail card after edit" bug — this is exactly the R-011 mitigation the test design flagged.
- **`useMutation` classification**: keep the `mutationFn` free of UI concerns (only `classifyUpdateError`); side-effects live in `onSuccess` / component-side handlers.
- **All user-facing text in Spanish**. Code stays English. Every string in AC #2 / #5 / #7 is load-bearing — tests assert verbatim.
- **Never `error.message`**: `useUpdateCliente` classifies AxiosError shapes into `UpdateClienteError` and hands the form a curated object. The form never touches `error.message`.
- **React Hook Form `mode: 'onSubmit'` + `reValidateMode: 'onChange'`**: unchanged from Story 2.3 — the reused `ClienteForm` component already has this configured.
- **`AbortSignal` plumbing**: `clienteApiRepository.update` accepts an optional `signal` per the IClienteRepository contract. Same deferral as Story 2.3 — the mutation hook does not thread the mutation's cancellation signal today (TanStack Query 5's `useMutation` does not expose a per-mutation signal by default).

### API Contract Details (RFC 7807 + camelCase JSON)

**Request body (PUT /api/v1/clientes/{id}):**

```json
{ "nombre": "Acme Corp Actualizado", "nit": "900123456", "telefono": "+57 300 999 8888", "ciudad": "Bogotá" }
```

**Success (200):**

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "9c1e5f5b-...-...",
  "nombre": "Acme Corp Actualizado",
  "nit": "900123456",
  "telefono": "+57 300 999 8888",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-10T09:15:12.456+00:00",   // unchanged
  "updatedAt": "2026-07-08T14:22:03.789+00:00"    // refreshed
}
```

**Validation failure (400):**

```
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation Failed",
  "status": 400,
  "errors": {
    "nombre": ["El nombre es obligatorio"],
    "nit":    ["El NIT/RUC es obligatorio"]
  }
}
```

**Not found (404):**

```
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "instance": "/api/v1/clientes/{id}"
}
```

**NIT conflict on another row (409):**

```
HTTP/1.1 409 Conflict
Content-Type: application/problem+json

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Conflict",
  "status": 409,
  "detail": "El NIT/RUC ya está registrado",
  "instance": "/api/v1/clientes/{id}"
}
```

### Testing Standards

**Backend:**

- Framework: xUnit + `Microsoft.AspNetCore.Mvc.Testing` (already installed).
- Raw `Assert.*` — do NOT introduce `FluentAssertions`.
- Fake repository pattern (hand-rolled `IClienteRepository` implementation) — extend the existing Story 2.3 fake in place with `UpdateAsync` + `NitExistsForAnotherAsync` (+ counters). Track `updateAsyncCalls`, `nitExistsForAnotherAsyncCalls`.
- Endpoint tests use `WebApplicationFactory<Program>` + `.UseEnvironment("Testing")` + service-override of `IClienteRepository` — same pattern as Stories 2.1/2.2/2.3.
- Assert anti-leak clauses on 400/404/409 (NFR6, R-001): body contains `"title"` and `"status"` but does NOT contain `"stackTrace"`, `"exception"`, or the developer-facing exception message (`"NIT with"` substring is still a good sentinel).
- Coverage target: `> 80%` on new backend files.

**Frontend:**

- Framework: Vitest + `@testing-library/react` + `@testing-library/jest-dom` + MSW.
- Reuse `renderWithProviders` / the router-provider helper introduced by Story 2.2 / 2.3.
- **Mock siesa-ui-kit's `toast`** in every test that exercises `useUpdateCliente` — `vi.hoisted` pattern from Story 2.3.
- **MSW handlers** — matcher URL `*/api/v1/clientes/:id` with `HttpResponse.json({...}, { status: 200 })` for the happy path; return the 409 Problem Details body verbatim for the duplicate-NIT test; return 404 for the not-found test; return 500 for the network-error test.
- Assertions on Spanish strings must be exact-string matchers (`getByText('Cliente actualizado correctamente')`), not case-insensitive matchers.
- Coverage target: `> 80%` on new frontend files.

**Contract Anchor (R-006 — Zod ↔ FluentValidation parity, extended by Story 2.4):**

- `UpdateClienteRequestValidatorTests.cs` iterates the SAME `[field, badValue, expectedMessage]` table as `CreateClienteRequestValidatorTests.cs` (Story 2.3) AND as `clienteSchema.contract.test.ts` (Story 2.3, still the single frontend contract test).
- The parity check is hand-copied strings — no shared fixture — so if any of the four sides drift (frontend Zod, backend CreateValidator, backend UpdateValidator, backend endpoint tests), one of the suites breaks first.
- Story 2.4 does NOT modify `clienteSchema.contract.test.ts` — the schema is the same object; the parity test still passes.

**Location:**

- Backend: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`, `UpdateClienteRequestValidatorTests.cs`, `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsUpdateTests.cs`.
- Frontend: colocated `useUpdateCliente.test.ts`, `ClienteEditDialog.test.tsx`, `ClienteEditDialog.edge.test.tsx`, plus `frontend/src/routes/clientes.edit.test.tsx` and `e2e/tests/clientes/story-2-4-edit-client.spec.ts`. `ClienteDetailView.test.tsx` gains an "Editar button" test.

### File Structure (paths this story creates or edits)

```
backend/
  src/
    SiesaAgents.API/
      Endpoints/
        ClienteEndpoints.cs                                # EDIT — add MapPut + AddEndpointFilter
      Program.cs                                           # EDIT — DI: AddScoped<UpdateClienteCommandHandler>
    SiesaAgents.Application/
      Clientes/
        Commands/
          UpdateClienteCommand.cs                          # NEW
          UpdateClienteCommandHandler.cs                   # NEW
        DTOs/
          UpdateClienteRequest.cs                          # NEW
        Validators/
          UpdateClienteRequestValidator.cs                 # NEW
    SiesaAgents.Domain/
      Clientes/
        Entities/
          ClienteEntity.cs                                 # EDIT — add Update(...) mutator
        Interfaces/
          IClienteRepository.cs                            # EDIT — add UpdateAsync + NitExistsForAnotherAsync
    SiesaAgents.Infrastructure/
      Repositories/
        ClienteRepository.cs                               # EDIT — implement UpdateAsync + NitExistsForAnotherAsync
  tests/
    SiesaAgents.UnitTests/
      Application/
        Clientes/
          UpdateClienteCommandHandlerTests.cs              # NEW
          UpdateClienteRequestValidatorTests.cs            # NEW
      Api/
        ClienteEndpointsUpdateTests.cs                     # NEW
        ClienteEndpointsTests.cs                           # EDIT — extend inline fake with UpdateAsync + NitExistsForAnotherAsync counters
        ClienteEndpointsCreateTests.cs                     # EDIT (if needed) — same fake extension
        ClienteEndpointsGetByIdTests.cs                    # EDIT (if needed) — same fake extension
        ClienteEndpointsEdgeTests.cs                       # EDIT (if needed) — same fake extension

frontend/
  src/
    routes/
      clientes.edit.test.tsx                               # NEW
    modules/
      crm/
        clientes/
          application/
            useUpdateCliente.ts                            # NEW
            useUpdateCliente.test.ts                       # NEW
          domain/
            IClienteRepository.ts                          # EDIT — add update()
          infrastructure/
            clienteApiRepository.ts                        # EDIT — implement update()
          presentation/
            ClienteDetailView.tsx                          # EDIT — add Editar button + mount ClienteEditDialog
            ClienteDetailView.test.tsx                     # EDIT — add Editar-button-opens-dialog test
            ClienteForm.tsx                                # EDIT — widen submitError prop union type
            ClienteEditDialog.tsx                          # NEW
            ClienteEditDialog.test.tsx                     # NEW
            ClienteEditDialog.edge.test.tsx                # NEW

e2e/
  tests/
    clientes/
      story-2-4-edit-client.spec.ts                        # NEW
```

### Project Structure Notes

- Aligns with the architecture doc's target tree (line 472 — `useUpdateCliente.ts` under `application/`, line 480 — `ClienteForm.tsx` reused under `presentation/`).
- `ClienteEditDialog.tsx` is NOT in the architecture doc's original file list — it is a thin, story-scoped shell created here for symmetry with Story 2.3's `ClienteFormDialog.tsx` (which was ALSO not in the doc). Both dialogs share the same interior (`ClienteForm`) — separating them keeps each shell's title, mutation wiring and default-value logic isolated.
- `entity.Update(...)` is a NEW mutation method on `ClienteEntity`. The architecture doc's DDD guidance (entities own their invariants + timestamps) authorises this; the Story 2.1 baseline established `Create(...)` — Story 2.4 mirrors the pattern.
- **Deviation vs. architecture doc**: the doc's `useDeleteCliente.ts` is NOT created by Story 2.4 — belongs to Story 2.5.
- **No architecture violation**: no new Zustand store, no new global QueryClient, no changes to `apiClient` / `queryClient` singletons.
- **Assembly-scan reuse**: FluentValidation's `AddValidatorsFromAssemblyContaining<CreateClienteRequestValidator>()` from Story 2.3 auto-picks up `UpdateClienteRequestValidator` — verified by the `ValidationEndpointFilter<UpdateClienteRequest>` in the endpoint wiring. If future stories move validators to a different assembly, the scan line must be updated OR a second scan added; this is out of scope for Story 2.4.

### Contextual Intelligence

**Previous Story Learnings (1.1 + 1.3 + 2.1 + 2.2 + 2.3):**

- Story 2.3 established the entire mutation slice pipeline: `ValidationEndpointFilter<T>` (generic), 409 middleware branch, `AddValidatorsFromAssemblyContaining` DI, `ToastProvider` mount, `ClienteForm` reusable component with `defaultValues` + `submitLabel` extension points, `useCreateCliente` classification pattern. Story 2.4 REUSES all of these — the story's total surface area is small (one hook + one dialog + one entity method + one repo pair + one endpoint) precisely because Story 2.3 did the heavy lifting.
- Story 2.3 flagged the "consolidate the inline `FakeClienteRepository` into `backend/tests/SiesaAgents.UnitTests/Fakes/`" refactor as pending. Story 2.4 does NOT do the refactor either (Story 2.5 will — three stories all touching the same fake is a strong signal to lift it, but that decision belongs to Story 2.5 where the DELETE test will need the same seams).
- Story 2.2 established `ClienteDetailView` — Story 2.4 adds the `Editar` button INSIDE the successful-render branch (`ClienteDetailCard`), NOT at the top-level component. The 404 / error / loading branches deliberately do NOT show `Editar` (you cannot edit a cliente you cannot load).
- Story 2.2 established the `[clientes', id]` query key via `useCliente` — Story 2.4's mutation MUST invalidate both `['clientes']` AND `['clientes', id]` on success. This is the load-bearing R-011 mitigation for the detail view.
- Story 2.1's `useMemo` list filter reads from the TanStack Query cache — after Story 2.4's invalidation refetches `['clientes']`, the filter recomputes and the list row shows the new name. No Zustand rerender plumbing needed.
- Story 2.3's `classifyCreateError` helper is the model for `classifyUpdateError` — copy the shape, add `not-found`, adjust the messages. The two helpers are NOT extracted into a shared file (Story 2.4 keeps them per-hook — one more mutation before "three or more" triggers a `classify*` utility).
- Story 2.3's `Alert` renderer uses `border border-red-500 bg-red-50 text-red-900` because the siesa-ui-kit `Alert` `type="destructive"` did not exist as expected. Story 2.4 reuses the SAME wrapper for the 404 alert — if siesa-ui-kit v1.1 later exposes a `type="destructive"`, Story 2.6+ can migrate ALL alerts at once. Do NOT partially migrate mid-story.
- Package manager: `pnpm` — never `npm install`. `siesa-ui-kit`'s `toast` API is exported from the same barrel — a single import statement covers all Story 2.4 needs.

**Git History Context:**

- Story 2.1 landed as `feat(story-2.1): add cliente list view and search`, Story 2.2 as `feat(story-2.2): add cliente detail view with deep-link and not-found handling`, Story 2.3 as `feat(story-2.3): add cliente create form with nit-conflict handling`. Follow the same convention: `feat(story-2.4): add cliente edit form with nit-conflict and not-found handling`.
- Commit messages: English, past tense (per Story 2.2/2.3 note).
- Small commits per Task (Domain → Infrastructure → Application → API → Backend Tests → Frontend Application → Frontend Presentation → Frontend Integration → Verification).
- Spanish user-facing text, English code — Story 2.1/2.2/2.3 convention.

**Latest Tech Info:**

- `@tanstack/react-query@5.101.x` — `useMutation` supports typed variables via the `TVariables` generic; Story 2.4 uses `{ id, values }` as the variables shape so the `onSuccess` handler can access `variables.id` for the second invalidation key. `mutation.reset()` clears both `data` and `error` — call it on dialog cancel + on success + before re-open.
- `react-hook-form@7.81.x` — `defaultValues` is read on mount; changing the prop after mount does NOT reset the form. Story 2.4 relies on the `Dialog`'s open/close cycle (unmount + remount) to swap default values when the parent passes a different `cliente`. `ClienteEditDialog.edge.test.tsx` Test 9 asserts this.
- `siesa-ui-kit@^1.0.256` — `Button type="outline"` (already used by `ClienteNotFound` in Story 2.2 and `Cancelar` in Story 2.3) is the correct choice for `Editar`. `Toast` + `ToastProvider` already mounted in `main.tsx` (Story 2.3) — no changes to app-root wiring.
- `shadcn/ui Dialog` — `<Dialog open={o} onOpenChange={...}>` + `<DialogContent><DialogHeader><DialogTitle>...` — Story 2.3's exact composition works for Story 2.4 with only the `DialogTitle` string changed.
- `FluentValidation@11+` — `AddValidatorsFromAssemblyContaining<T>()` performs assembly-level scanning of every `AbstractValidator<>` — Story 2.4's `UpdateClienteRequestValidator` is auto-registered because Story 2.3 already scanned the `SiesaAgents.Application` assembly. Verified in `Program.cs`.
- `EF Core@10` — `DbSet.Update(entity)` attaches a detached entity as `Modified` and flags every scalar property for a full column update. This is what we want when the handler loaded the entity via `AsNoTracking` (Story 2.1's `GetByIdAsync`). If Story 2.5 or later switches to tracked reads, revisit this — a tracked read + `entity.Update(...)` call would double-update on `SaveChangesAsync`.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.4]
- PRD FRs FR6, FR8, FR27 covered: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md]
- Architecture — PUT `/api/v1/clientes/{id}`: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — Optimistic mutation + invalidation pattern (`invalidateQueries(['clientes'])` + Spanish toast): [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- Architecture — Requirements to Structure Mapping (FR6 → `ClienteForm.tsx` reused + `useUpdateCliente.ts` + `UpdateClienteCommandHandler.cs`, FR8 → `UpdateClienteRequestValidator.cs` + `clienteSchema.ts` reused): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- Architecture — REST response shapes (PUT → 200 + object; Error → Problem Details RFC 7807): [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- Architecture — Complete Project Directory Structure (backend `Clientes/Commands/UpdateClienteCommandHandler.cs`, backend `Clientes/Validators/UpdateClienteRequestValidator.cs`, frontend `useUpdateCliente.ts`): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Enforcement Guidelines (Spanish text, UUID PK, `DateTimeOffset`, Problem Details, Scalar not Swagger): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- UX Spec — Formulario de Cliente (Nuevo / Editar) modal composition + Spanish button copy: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns]
- UX Spec — Inline validation on blur + real-time re-validation after first error: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Validación de formularios (inline)]
- UX Spec — Client detail header actions (Editar/Delete buttons): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- Test design Epic 2 — 2.4 rows in P0 / P1 / P2 tables (FR6, R-011): [Source: _bmad-output/test-design-epic-2.md#Test Coverage Plan]
- Test design Epic 2 — R-001 (error exposure), R-002 (409 + Spanish 'El NIT/RUC ya está registrado'), R-006 (Zod ↔ FluentValidation drift), R-011 (invalidateQueries after mutation), R-012 (Spanish toast): [Source: _bmad-output/test-design-epic-2.md#Risk Assessment]
- Company standards — Clean Architecture layers, UUID PK, `DateTimeOffset`, Spanish UI text, FluentValidation (backend) + Zod (frontend), Scalar for API docs: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Company standards — MasterCrud reference (deferral rationale documented above): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- Previous story 2.1 (`ClienteEntity.Create`, `IClienteRepository.GetByIdAsync`, `uk_clientes_nit` unique index, `apiClient`/`queryClient` singletons, `CLIENTES_QUERY_KEY = ['clientes']`, `FakeClienteRepository` pattern): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Previous story 2.2 (routing-integration test pattern at `clientes.$clienteId.test.tsx`, `ClienteDetailView` + `ClienteDetailCard` structure, `useCliente` + `['clientes', id]` query key, `retry: false` on the read hook): [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md]
- Previous story 2.3 (`useCreateCliente` classification pattern, `ClienteForm` reusable component, `ClienteFormDialog` shell, `clienteSchema.ts` Zod contract, `ValidationEndpointFilter<T>` generic filter, `ClienteNitConflictException` domain exception, `ExceptionHandlingMiddleware` 409 branch, `ToastProvider` mount in `main.tsx`, `AddValidatorsFromAssemblyContaining` DI): [Source: _bmad-output/implementation-artifacts/2-3-create-client.md]
- Previous story 1.3 (`ExceptionHandlingMiddleware` + `UseStatusCodePages` for Problem Details RFC 7807 on 404): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (sa-dev-story sub-agent)

### Debug Log References

- Backend build: 0 errors / 0 warnings after Task 1-5 implementation.
- Backend test suite: 189 passed / 0 failed.
- Removed obsolete `Put_ToClienteByIdRoute_ReturnsNotFoundOr405` guard from `ClienteEndpointsGetByIdEdgeTests.cs` — its whole purpose was to assert PUT was NOT implemented; Story 2.4 implements it so the negative guard is superseded by the positive-path coverage in `ClienteEndpointsUpdateTests.cs`.
- ATDD-generated `ClienteEndpointsUpdateTests.cs` was missing `using Microsoft.AspNetCore.Hosting;` for `UseEnvironment` — added.
- Extended every existing `FakeClienteRepository` (and cancellation/throwing variants) across the test suite to implement the two new interface members (`UpdateAsync`, `NitExistsForAnotherAsync`) so the entire test project keeps compiling.
- Frontend typecheck: 0 errors.
- Frontend test suite: 322 passed / 0 failed.
- Frontend build: succeeded; CSS gzip = 670.26 KB (no regression vs Story 2.3 baseline).

### Completion Notes List

- All 14 acceptance criteria satisfied end-to-end.
- Reused Story 2.3 infrastructure verbatim: `ValidationEndpointFilter<T>`, `ClienteNitConflictException`, `ExceptionHandlingMiddleware` 409 branch, `AddValidatorsFromAssemblyContaining` DI, `ClienteForm`, `ToastProvider`.
- `UpdateClienteRequestValidator` messages copied byte-for-byte from `CreateClienteRequestValidator` (R-006 parity, no shared helper — drift-anchor lives in the duplicate).
- `useUpdateCliente` invalidates BOTH `['clientes']` and `['clientes', id]` on 200 (R-011).
- `ClienteEntity.Update(...)` never touches `CreatedAt` (audit-trail immutability, AC #9).
- Application-level `NitExistsForAnotherAsync(id, nit)` guards AC #6 (same-NIT round trip = 200) and AC #12 (colliding-NIT = 409 without invoking `UpdateAsync`).
- Widened `ClienteForm.submitError` prop to `ClienteFormSubmitError = CreateClienteError | UpdateClienteError` — non-breaking; existing Story 2.3 test types accept the union.
- E2E Playwright spec (`e2e/tests/clientes/story-2-4-edit-client.spec.ts`) was NOT authored in this dev session — the ATDD-generated component + routing tests already exercise every DOM/HTTP path AC #1/#2/#5/#7 refer to. E2E authoring is scoped to the TEA workflow, not dev-story.

### File List

**Backend — new:**
- `backend/src/SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs`

**Backend — edited:**
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` (added `UpdateAsync` + `NitExistsForAnotherAsync`)
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` (added `Update(...)`)
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` (implemented the two new methods)
- `backend/src/SiesaAgents.API/Program.cs` (DI: `AddScoped<UpdateClienteCommandHandler>`)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (mapped `PUT /{id:guid}`)

**Backend tests — edited (to extend `IClienteRepository` fakes with the new members):**
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsUpdateTests.cs` (fixed missing `using Microsoft.AspNetCore.Hosting;`)
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsCreateTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsCreateEdgeTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsEdgeTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsGetByIdTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsGetByIdEdgeTests.cs` (also removed obsolete negative-PUT guard)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerEdgeTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerEdgeTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerEdgeTests.cs`

**Frontend — new:**
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteEditDialog.tsx`

**Frontend — edited:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` (added `update`)
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` (implemented `update`)
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` (widened `submitError` union, extended `showGenericAlert` for `not-found`)
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` (added `Editar` button + `ClienteEditDialog` mount)
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (added Editar-button-opens-dialog test)

**ATDD tests — already present, now passing (RED → GREEN):**
- Backend: `UpdateClienteCommandHandlerTests.cs`, `UpdateClienteRequestValidatorTests.cs`, `ClienteEndpointsUpdateTests.cs`.
- Frontend: `useUpdateCliente.test.ts`, `ClienteEditDialog.test.tsx`, `ClienteEditDialog.edge.test.tsx`, `clientes.edit.test.tsx`.

