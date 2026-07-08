# Story 2.3: Create Client

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new client by filling in a form with Nombre, NIT/RUC, Teléfono and Ciudad,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on `/clientes`, **When** the user clicks the "Nuevo cliente" button in the left panel header (Story 2.1 rendered it `disabled` with `title="Disponible en Story 2.3"` — Story 2.3 MUST enable it), **Then** a modal dialog opens (shadcn/ui `Dialog` — the fallback approved by the architecture doc because siesa-ui-kit does not export a generic form modal — see MasterCrud reference §Alternativas para escenarios no-CRUD) with the title `"Nuevo cliente"` and a form containing exactly four required fields in this vertical order: `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`, plus two action buttons `"Cancelar"` and `"Guardar"` (siesa-ui-kit `Button` — `Cancelar` = `type="outline"`, `Guardar` = `type="default" color="primary"`). Field labels are Spanish, exact strings as listed. Focus lands on the `Nombre` input when the dialog opens (WCAG focus-management).

2. **Given** the dialog is open and every required field contains a non-empty trimmed value, **When** the user submits (clicks `Guardar` OR presses `Enter` inside any input), **Then** `POST /api/v1/clientes` is fired with body `{ nombre, nit, telefono, ciudad }` (JSON, camelCase), the mutation hook `useCreateCliente` invalidates the `['clientes']` query key on success (FR27 — R-011 mitigation), the dialog closes, and a success `toast` is shown with the exact Spanish copy `"Cliente creado correctamente"` (siesa-ui-kit `toast.success`). The newly-created row appears in the left panel list without a manual reload (FR27), positioned first (creation defaults to `createdAt DESC` — Story 2.1 default order).

3. **Given** the user submits with one or more required fields empty (or containing only whitespace), **When** React Hook Form runs its Zod-based validation (`clienteSchema` — Story 2.3 introduces the schema), **Then** the request is **NOT** sent to the backend (MSW handler call count === 0), an inline error message is rendered under each empty field via `aria-describedby` binding a `role="alert"` node with the exact Spanish copy per field:
   - Nombre → `"El nombre es obligatorio"`
   - NIT/RUC → `"El NIT/RUC es obligatorio"`
   - Teléfono → `"El teléfono es obligatorio"`
   - Ciudad → `"La ciudad es obligatoria"`
   Errors surface on the FIRST submit attempt (`mode: 'onSubmit'`) and update in real time thereafter (`reValidateMode: 'onChange'`). The `Guardar` button stays enabled during validation — it is not conditionally-disabled — so the click always produces feedback (avoids the "dead button" anti-pattern flagged by Story 2.1 review).

4. **Given** the user submits a form whose `nit` value already exists in the database, **When** the backend returns `409 Conflict` with a Problem Details RFC 7807 body containing `title="Conflict"` and `detail="El NIT/RUC ya está registrado"`, **Then** the frontend surfaces the exact Spanish copy `"El NIT/RUC ya está registrado"` as an inline error under the `NIT/RUC` field (NOT as a toast — the error is per-field and per-input), the dialog stays open with the previously-typed values preserved, the `Guardar` button re-enables, and the raw backend error body is NEVER exposed (NFR6). No `stackTrace`, `exception`, or `error.message` string is ever rendered to the DOM.

5. **Given** the user submits a form whose `nit` is unique, **When** the backend returns `201 Created` with a `Location: /api/v1/clientes/{newId}` response header and a body that deserialises into a full `ClienteDto` (matching the Story 2.1 shape: `{ id, nombre, nit, telefono, ciudad, createdAt, updatedAt }`), **Then** the mutation `onSuccess` handler (a) calls `queryClient.invalidateQueries({ queryKey: ['clientes'] })` — the ONLY invalidation Story 2.3 performs (R-011), (b) closes the dialog, (c) shows the success toast, and (d) does NOT navigate the user away from `/clientes` (Story 2.3 stays on the list view; auto-navigation to `/clientes/:newId` is out of scope — the UX spec Journey 2 suggests it for mobile-parking-lot flow but the split-panel desktop flow keeps context per architecture line 411).

6. **Given** the user clicks `Cancelar` OR presses `Escape` OR clicks the dialog overlay, **When** the dialog closes, **Then** the form state is **discarded** (React Hook Form `reset()` on unmount), no `POST` request is fired, and re-opening the dialog shows an empty form (never a stale state).

7. **Given** the backend returns a non-409 non-2xx status (500, 503, network error), **When** the mutation settles with an error, **Then** the dialog stays open with the typed values preserved, an inline `Alert` (siesa-ui-kit `Alert` — `variant="destructive"` or equivalent per its API) appears at the top of the form body with the exact Spanish copy title `"No se pudo guardar"` and subtitle `"Comprueba tu conexión e intenta nuevamente."`, and the `Guardar` button re-enables so the user can retry. The raw error message is NEVER shown (NFR6).

8. **Given** the mutation is in flight (between click and settle), **When** the network round-trip is longer than one paint frame, **Then** the `Guardar` button shows a spinner + `aria-busy="true"` and becomes `disabled`, the `Cancelar` button stays enabled (users can abort), the four form inputs become read-only (`aria-readonly="true"` + `readOnly` prop) so the user cannot type-race the request, and the toast is NOT shown until the settle. On abort/cancel the in-flight request MUST be cancelled via `AbortSignal` (React Hook Form + TanStack Query mutation `mutationFn(_, { signal })` — architecturally consistent with Story 2.1/2.2 axios `signal` plumbing).

9. **Given** the backend endpoint `POST /api/v1/clientes` is deployed, **When** any client hits it with a well-formed `CreateClienteRequest` body `{ nombre, nit, telefono, ciudad }` (all four non-null, non-empty strings, trimmed) whose `nit` does NOT already exist, **Then** it returns HTTP `201 Created` with (a) a `Location: /api/v1/clientes/{id}` header, (b) `Content-Type: application/json`, (c) body deserialising to a full `ClienteDto` where `createdAt === updatedAt`, both `DateTimeOffset.UtcNow` (company standard — never `DateTime`), and the `id` is a fresh `Guid.NewGuid()`. The row is persisted through `IClienteRepository.AddAsync(cliente, ct)` (Story 2.3 adds this method to the interface — Story 2.1 declared read-only ops only) and `SaveChangesAsync` inside the handler.

10. **Given** the request body is missing a required field (null, empty string, or whitespace-only), **When** the FluentValidation `CreateClienteRequestValidator` runs during model binding (registered via `.WithValidation<CreateClienteRequest>()` — the Story 2.3 endpoint uses a helper `ValidationEndpointFilter` for RFC 7807 error shaping), **Then** the endpoint returns HTTP `400 Bad Request` with a Problem Details body `{ type, title: "Validation Failed", status: 400, errors: { <field>: [<message>] } }`. The `errors` map keys are camelCase (`nombre`, `nit`, `telefono`, `ciudad`) and the values are Spanish messages that MATCH the frontend Zod messages verbatim to satisfy R-006 (Zod ↔ FluentValidation parity):
    - `nombre` → `"El nombre es obligatorio"`
    - `nit` → `"El NIT/RUC es obligatorio"`
    - `telefono` → `"El teléfono es obligatorio"`
    - `ciudad` → `"La ciudad es obligatoria"`
    NO `stackTrace`, NO `exception` string, NO framework internals (NFR6, R-001).

11. **Given** the request body's `nit` already exists in the database (unique constraint `uk_clientes_nit` — declared by Story 2.1), **When** the handler executes, **Then** it detects the duplicate via `IClienteRepository.NitExistsAsync(nit, ct)` BEFORE calling `AddAsync` (application-level check — avoids catching `DbUpdateException`, R-002), throws `ClienteNitConflictException` (new sealed domain-level exception in `SiesaAgents.Domain.Clientes.Exceptions.ClienteNitConflictException`), which `ExceptionHandlingMiddleware` translates into HTTP `409 Conflict` with a Problem Details body `{ type, title: "Conflict", status: 409, detail: "El NIT/RUC ya está registrado", instance }`. The body includes NO `stackTrace`, NO `exception`, NO SQL internals (NFR6 anti-leak). A second, database-level defense (the unique index) STILL exists — but the application check keeps 409 responses deterministic even under race conditions where two threads pass the pre-check (defense-in-depth).

12. **Given** `dotnet build backend/SiesaAgents.sln` and `pnpm --dir frontend build && pnpm --dir frontend typecheck` are executed, **When** both toolchains compile, **Then** backend build reports 0 errors / 0 new warnings (the pre-existing `NU1903` suppression from Story 1.1 stays), frontend build succeeds under TypeScript strict mode with 0 errors and NO `any` types are introduced. The frontend CSS gzip must not regress by more than +8 KB versus the Story 2.2 baseline (670.25 KB) — the modal + form + toast provider mount is expected to add ~4–6 KB.

13. **Given** `dotnet test backend/SiesaAgents.sln` and `pnpm --dir frontend test` are executed, **When** all tests run, **Then** every existing test from Stories 1.1/1.2/1.3/2.1/2.2 continues to pass AND the new tests introduced by this story pass — see the enumerated test list under "Testing Standards" below. Coverage of net-new files under `modules/crm/clientes/**` and `SiesaAgents.Application/Clientes/Commands/**` + `Validators/**` + `SiesaAgents.Domain/Clientes/Exceptions/**` is `> 80%` (company standard).

## Tasks / Subtasks

- [x] Task 1 — Backend Domain layer: `AddAsync` + `NitExistsAsync` + `ClienteNitConflictException` (AC: #9, #11)
  - [ ] Edit `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`:
    - Add `Task AddAsync(ClienteEntity cliente, CancellationToken ct);` (returns `Task`, not `Task<ClienteEntity>` — the entity is mutated by EF Core in-place and the caller already holds the reference).
    - Add `Task<bool> NitExistsAsync(string nit, CancellationToken ct);` (case-sensitive comparison — NIT/RUC is a canonical business identifier; upper/lower variations are treated as distinct until FR7 says otherwise, which Story 2.5 handles).
    - Do NOT declare `UpdateAsync`/`DeleteAsync` — Stories 2.4/2.5.
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Exceptions/ClienteNitConflictException.cs`:
    ```csharp
    namespace SiesaAgents.Domain.Clientes.Exceptions;

    /// <summary>
    /// Thrown when an attempt to create a Cliente collides with an existing
    /// NIT/RUC (uniqueness violation — FR7). The exception message is the
    /// developer-facing default; user-facing text is set by the
    /// ExceptionHandlingMiddleware.
    /// </summary>
    public sealed class ClienteNitConflictException : Exception
    {
        public string Nit { get; }
        public ClienteNitConflictException(string nit)
            : base($"A cliente with NIT '{nit}' already exists.")
        {
            Nit = nit;
        }
    }
    ```
    - `sealed` — no domain-level subtypes needed.
    - The user-facing Spanish message lives in the middleware, NOT in the exception (separation of concerns — the exception can be thrown from unit tests that never touch the middleware).

- [x] Task 2 — Backend Infrastructure: `ClienteRepository.AddAsync` + `NitExistsAsync` (AC: #9, #11)
  - [ ] Edit `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`:
    ```csharp
    public async Task AddAsync(ClienteEntity cliente, CancellationToken ct)
    {
        _db.Clientes.Add(cliente);
        await _db.SaveChangesAsync(ct);
    }

    public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
    {
        return _db.Clientes
            .AsNoTracking()
            .AnyAsync(c => c.Nit == nit, ct);
    }
    ```
    - `AddAsync` calls `SaveChangesAsync` inside the repository — the handler stays free of EF Core plumbing (Clean Architecture layering).
    - `NitExistsAsync` uses `AsNoTracking()` (read-only) and `AnyAsync` (translates to `EXISTS (SELECT 1 ...)` — cheaper than `Count > 0`).
    - Do NOT wrap in a transaction — the caller (handler) is responsible for orchestration; adding a transaction here would fight the DbContext's implicit change-tracking scope.
  - [ ] Do NOT change `ClienteConfiguration.cs` — the `uk_clientes_nit` unique index from Story 2.1 already enforces the DB-level defense.

- [x] Task 3 — Backend Application layer: Command + Handler + DTO + Validator (AC: #9, #10, #11)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`:
    ```csharp
    namespace SiesaAgents.Application.Clientes.DTOs;

    public sealed record CreateClienteRequest(
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad);
    ```
    - `sealed record` — value semantics + immutability.
    - camelCase JSON binding follows .NET defaults — do NOT annotate `[JsonPropertyName]`.
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`:
    ```csharp
    using SiesaAgents.Application.Clientes.DTOs;

    namespace SiesaAgents.Application.Clientes.Commands;

    public sealed record CreateClienteCommand(CreateClienteRequest Request);
    ```
    - Wraps the request DTO so the handler signature is symmetric with the Story 2.1/2.2 query pattern.
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`:
    ```csharp
    using SiesaAgents.Application.Clientes.DTOs;
    using SiesaAgents.Domain.Clientes.Entities;
    using SiesaAgents.Domain.Clientes.Exceptions;
    using SiesaAgents.Domain.Clientes.Interfaces;

    namespace SiesaAgents.Application.Clientes.Commands;

    public sealed class CreateClienteCommandHandler
    {
        private readonly IClienteRepository _repository;
        public CreateClienteCommandHandler(IClienteRepository repository) => _repository = repository;

        public async Task<ClienteDto> HandleAsync(CreateClienteCommand command, CancellationToken ct)
        {
            var request = command.Request;

            // Application-level uniqueness check (AC #11 / R-002).
            // The DB unique index remains as a second-line defense.
            if (await _repository.NitExistsAsync(request.Nit, ct))
            {
                throw new ClienteNitConflictException(request.Nit);
            }

            var entity = ClienteEntity.Create(
                request.Nombre,
                request.Nit,
                request.Telefono,
                request.Ciudad);

            await _repository.AddAsync(entity, ct);

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
    - Direct handler (no MediatR) — matches the Story 2.1/2.2 pattern.
    - Reuses `ClienteEntity.Create(...)` (Story 2.1) — the domain factory is the single source of truth for entity construction.
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`:
    ```csharp
    using FluentValidation;
    using SiesaAgents.Application.Clientes.DTOs;

    namespace SiesaAgents.Application.Clientes.Validators;

    public sealed class CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>
    {
        public CreateClienteRequestValidator()
        {
            RuleFor(x => x.Nombre).NotEmpty().WithMessage("El nombre es obligatorio");
            RuleFor(x => x.Nit).NotEmpty().WithMessage("El NIT/RUC es obligatorio");
            RuleFor(x => x.Telefono).NotEmpty().WithMessage("El teléfono es obligatorio");
            RuleFor(x => x.Ciudad).NotEmpty().WithMessage("La ciudad es obligatoria");
        }
    }
    ```
    - Messages MUST match the Zod schema strings verbatim (AC #3, #10, R-006).
    - `NotEmpty()` in FluentValidation rejects null, empty string, AND whitespace-only (default behaviour) — matches the Zod `.trim().min(1)` chain.
    - Story 2.3 introduces ONLY presence rules. Format validators (NIT charset, phone regex) are P2 test scope and deferred to a follow-up refinement — Story 2.3's AC only asks for FR8 (required-field validation).
  - [ ] Register DI in `backend/src/SiesaAgents.API/Program.cs`, near the existing `AddScoped<GetClientesQueryHandler>()` / `GetClienteByIdQueryHandler` lines:
    ```csharp
    // Story 2.3 — Cliente creation
    builder.Services.AddScoped<CreateClienteCommandHandler>();
    builder.Services.AddValidatorsFromAssemblyContaining<CreateClienteRequestValidator>();
    ```
    - `AddValidatorsFromAssemblyContaining<...>()` is the FluentValidation DI helper; requires the `FluentValidation.DependencyInjectionExtensions` NuGet package. If it is not already installed on `SiesaAgents.API`, add it now: `dotnet add src/SiesaAgents.API package FluentValidation.DependencyInjectionExtensions`. If `FluentValidation` itself is only referenced from `SiesaAgents.Application` (verify via `.csproj`), do NOT add the plain `FluentValidation` package again to the API project — a project reference to `SiesaAgents.Application` is enough.

- [x] Task 4 — Backend API: `POST /api/v1/clientes` + validation endpoint filter + 409 middleware branch (AC: #9, #10, #11)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ValidationEndpointFilter.cs`:
    ```csharp
    using FluentValidation;
    using Microsoft.AspNetCore.Http.HttpResults;

    namespace SiesaAgents.API.Endpoints;

    /// <summary>
    /// Endpoint filter that runs FluentValidation for a specific argument type
    /// and returns a Problem Details RFC 7807 400 response when validation fails.
    /// Keeps Minimal API endpoints clean of manual validation branching.
    /// </summary>
    public sealed class ValidationEndpointFilter<T> : IEndpointFilter where T : class
    {
        private readonly IValidator<T> _validator;

        public ValidationEndpointFilter(IValidator<T> validator) => _validator = validator;

        public async ValueTask<object?> InvokeAsync(
            EndpointFilterInvocationContext context,
            EndpointFilterDelegate next)
        {
            var candidate = context.Arguments.OfType<T>().FirstOrDefault();
            if (candidate is null)
            {
                return await next(context);
            }

            var result = await _validator.ValidateAsync(candidate, context.HttpContext.RequestAborted);
            if (result.IsValid)
            {
                return await next(context);
            }

            var errors = result.Errors
                .GroupBy(f => char.ToLowerInvariant(f.PropertyName[0]) + f.PropertyName[1..])
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

            return Results.ValidationProblem(
                errors,
                title: "Validation Failed",
                statusCode: StatusCodes.Status400BadRequest);
        }
    }
    ```
    - The `PropertyName[0]` lowercasing produces camelCase keys (`nombre`, `nit`, `telefono`, `ciudad`) — matches the frontend contract (AC #10).
    - `Results.ValidationProblem` writes RFC 7807 with `errors: { field: [msg] }` — no custom body shape needed.
  - [ ] Edit `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`:
    - Add the `POST /` endpoint inside the same `MapGroup("/api/v1/clientes")` group used by Story 2.1/2.2:
    ```csharp
    group.MapPost("/", async (
            CreateClienteRequest request,
            CreateClienteCommandHandler handler,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var dto = await handler.HandleAsync(new CreateClienteCommand(request), ct);
            return Results.Created($"/api/v1/clientes/{dto.Id}", dto);
        })
        .AddEndpointFilter<ValidationEndpointFilter<CreateClienteRequest>>()
        .WithName("CreateCliente")
        .Produces<ClienteDto>(StatusCodes.Status201Created)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status409Conflict);
    ```
    - Add `using SiesaAgents.Application.Clientes.Commands;` and `using SiesaAgents.Application.Clientes.DTOs;` at the top if not already imported.
    - The `AddEndpointFilter<ValidationEndpointFilter<CreateClienteRequest>>()` wiring runs Story 2.3's validator BEFORE the handler — a 400 short-circuits the handler entirely.
  - [ ] Edit `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — add a `ClienteNitConflictException` handler branch that produces the RFC 7807 409 body:
    ```csharp
    catch (ClienteNitConflictException)
    {
        context.Response.StatusCode = StatusCodes.Status409Conflict;
        context.Response.ContentType = "application/problem+json";
        var problem = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.8",
            Title = "Conflict",
            Status = StatusCodes.Status409Conflict,
            Detail = "El NIT/RUC ya está registrado",
            Instance = context.Request.Path,
        };
        await context.Response.WriteAsJsonAsync(problem, options: null, contentType: "application/problem+json");
        return;
    }
    ```
    - Detail is Spanish (user-facing string — matches AC #4 frontend expectation).
    - Add `using SiesaAgents.Domain.Clientes.Exceptions;` at the top of the middleware file.
    - Place the `catch` BEFORE the generic `catch (Exception)` block so the specialised branch wins.
    - Do NOT include `stackTrace`, `exception`, or the raw exception message in the body (NFR6, R-001).

- [x] Task 5 — Backend tests: unit + endpoint + validator (AC: #9, #10, #11, #13)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`:
    - `HandleAsync_CreatesEntity_AndReturnsDto_WhenNitIsUnique` — fake repo returns `false` for `NitExistsAsync`; assert `AddAsync` called once with an entity whose fields match the request; assert returned DTO has `Id != Guid.Empty` and `CreatedAt == UpdatedAt`.
    - `HandleAsync_ThrowsClienteNitConflictException_WhenNitExists` — fake repo returns `true` for `NitExistsAsync`; assert `AddAsync` is NEVER called; assert `ClienteNitConflictException` is thrown with `.Nit` matching the input.
    - `HandleAsync_PassesRequestValues_ToEntityFactory` — assert the created entity's `Nombre/Nit/Telefono/Ciudad` equal the request values (this validates the mapping seam that R-006 relies on).
    - Use raw xUnit `Assert.*` (no FluentAssertions — Story 1.1 convention).
    - Reuse the existing `FakeClienteRepository` pattern (lifted from Story 2.1/2.2). If the fake still lives inline in `ClienteEndpointsTests.cs`, extend the file-scoped variant with `AddAsync` + `NitExistsAsync` — do NOT create a shared file yet (Story 2.4/2.5 will consolidate).
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteRequestValidatorTests.cs`:
    - `Validate_Passes_WhenAllFieldsPresent` — happy-path DTO passes.
    - For each of `Nombre`, `Nit`, `Telefono`, `Ciudad`: one test with `null`, one with `""`, one with `"   "` — assert each produces exactly one error whose message matches the Spanish string. This is the R-006 parity anchor point.
    - `Validate_ReturnsCamelCaseKeys` — NOT in the validator itself; asserted at the endpoint layer (see next test file).
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsCreateTests.cs`:
    - Reuse the `WebApplicationFactory<Program>` + `.UseEnvironment("Testing")` + fake-repo-override pattern established by Story 2.1/2.2 (`FactoryWithSeed` in `ClienteEndpointsTests.cs`). If the existing fake exposes only `GetAllAsync` + `GetByIdAsync`, extend it in-place to satisfy the new interface members.
    - `CreateCliente_Returns201_WithLocationHeader_AndDto_WhenBodyIsValid` — POST `{ nombre:"Acme", nit:"900123", telefono:"555", ciudad:"Cali" }`; assert `201`, `Content-Type` starts with `application/json`, `Location` header equals `/api/v1/clientes/{id}` where `id` matches the body's `id`, deserialised body's fields match the request.
    - `CreateCliente_Returns400_WithValidationProblem_WhenBodyIsIncomplete` — POST `{ nombre:"", nit:"", telefono:"", ciudad:"" }`; assert `400`, `Content-Type` starts with `application/problem+json`, body's `errors` map has EXACTLY the four keys `nombre`, `nit`, `telefono`, `ciudad` (camelCase), each carrying its Spanish message; body does NOT contain `"stackTrace"` or `"exception"` (NFR6).
    - `CreateCliente_Returns400_WithSpecificField_WhenOnlyOneFieldMissing` — POST `{ nombre:"Ok", nit:"", telefono:"Ok", ciudad:"Ok" }`; assert `400`, `errors.nit === ["El NIT/RUC es obligatorio"]`, `errors.nombre` unset.
    - `CreateCliente_Returns409_WithProblemDetails_WhenNitAlreadyExists` — seed the fake repo with a cliente whose NIT is `"900123"`; POST a new request with `nit:"900123"`; assert `409`, `Content-Type` starts with `application/problem+json`, `title === "Conflict"`, `status === 409`, `detail === "El NIT/RUC ya está registrado"`; body does NOT contain `"stackTrace"`, `"exception"`, or the string `"NIT with"` (developer-facing exception message — must NOT leak).
    - `CreateCliente_Returns409_EvenWhen_AddAsyncNeverInvoked` — assert the fake repo's `AddAsync` counter is `0` after the 409 (the application-level check prevents the write).
    - `CreateCliente_PersistsRow_ThatIsThenVisibleOnGet` — POST a valid body then GET `/api/v1/clientes`; assert the response array contains the new row.
    - Coverage target: `> 80%` on all new backend files.
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddleware_NitConflictTests.cs` (or extend the existing middleware test file if any):
    - `Middleware_Translates_ClienteNitConflictException_To_409_ProblemDetails` — build a `TestServer` that throws `ClienteNitConflictException("X")` from a dummy endpoint; hit it; assert `409`, `application/problem+json`, `detail === "El NIT/RUC ya está registrado"`, no `stackTrace`.

- [x] Task 6 — Frontend Application layer: Zod schema + `useCreateCliente` mutation hook (AC: #3, #4, #7, #8, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts`:
    ```typescript
    import { z } from 'zod'

    /**
     * Zod schema for the Create/Edit cliente form (Story 2.3 introduces it;
     * Story 2.4 reuses the same schema for edit). Messages match the backend
     * FluentValidation validator VERBATIM — R-006 parity anchor.
     */
    export const clienteSchema = z.object({
      nombre: z.string().trim().min(1, { message: 'El nombre es obligatorio' }),
      nit: z.string().trim().min(1, { message: 'El NIT/RUC es obligatorio' }),
      telefono: z.string().trim().min(1, { message: 'El teléfono es obligatorio' }),
      ciudad: z.string().trim().min(1, { message: 'La ciudad es obligatoria' }),
    })

    export type ClienteFormValues = z.infer<typeof clienteSchema>
    ```
    - `.trim().min(1)` catches empty AND whitespace-only strings — mirrors FluentValidation `NotEmpty()`.
    - Exact string parity with the backend is enforced by a contract test in Task 8.
  - [ ] Edit `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — extend the `IClienteRepository` implementation with a `create` method:
    ```typescript
    async create(payload: ClienteFormValues, signal) {
      const { data } = await apiClient.post<Cliente>('/api/v1/clientes', payload, { signal })
      return data
    },
    ```
    Import `ClienteFormValues` from `../application/clienteSchema`. Also update `IClienteRepository.ts`:
    ```typescript
    create(payload: ClienteFormValues, signal?: AbortSignal): Promise<Cliente>
    ```
    - Placing the payload type in `application/` means `infrastructure` imports UP into `application` — this is intentional and matches the frontend Clean Architecture convention documented by the architecture doc (frontend layers are relaxed relative to backend; the frontend `domain` is a pure type contract, and Zod-derived types live in `application`).
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`:
    ```typescript
    import { useMutation, useQueryClient } from '@tanstack/react-query'
    import { toast } from 'siesa-ui-kit'
    import { AxiosError } from 'axios'
    import type { Cliente } from '../domain/Cliente'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
    import { CLIENTES_QUERY_KEY } from './useClientes'
    import type { ClienteFormValues } from './clienteSchema'

    export interface CreateClienteError {
      /** 'nit-conflict' → 409; 'validation' → 400 (should not surface — frontend Zod catches it); 'network' → everything else */
      kind: 'nit-conflict' | 'validation' | 'network'
      nitMessage?: string
      generic?: { title: string; subtitle: string }
    }

    /**
     * Mutation hook for POST /api/v1/clientes (Story 2.3).
     *
     * On success:
     *   - invalidates ['clientes'] (R-011 mitigation)
     *   - fires the success toast in Spanish
     * On error the hook classifies the failure so the form component can
     * decide inline-field vs. top-of-form alerting (AC #4 vs. #7).
     */
    export function useCreateCliente() {
      const queryClient = useQueryClient()
      return useMutation<Cliente, CreateClienteError, ClienteFormValues>({
        mutationFn: async (payload) => {
          try {
            return await clienteApiRepository.create(payload)
          } catch (rawError) {
            throw classifyCreateError(rawError)
          }
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: CLIENTES_QUERY_KEY })
          toast.success('Cliente creado correctamente')
        },
      })
    }

    function classifyCreateError(rawError: unknown): CreateClienteError {
      if (rawError instanceof AxiosError) {
        const status = rawError.response?.status
        if (status === 409) {
          return { kind: 'nit-conflict', nitMessage: 'El NIT/RUC ya está registrado' }
        }
        if (status === 400) {
          // Backend validation reached FE only if Zod was bypassed — surface as generic.
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
    - The hook **never** reads `error.message` from axios — only the shape produced by `classifyCreateError`. This is the NFR6/R-001 anti-leak enforcement point on the frontend.
    - `toast.success` uses siesa-ui-kit's `toast` API — the `ToastProvider` is mounted in `__root.tsx` (see Task 9).
    - No optimistic UI: the AC does NOT require rollback semantics for create (R-005 is aimed at edit — Story 2.4). The list refetch after `invalidateQueries` satisfies FR27 in ≤ 500ms on the 500-record fixture (verified by NFR benchmarks).
  - [ ] Colocate `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`:
    - Test — success path: MSW returns 201 + valid DTO; assert the mutation resolves, `queryClient.invalidateQueries` is called with `['clientes']`, `toast.success` is called with `"Cliente creado correctamente"` (spy on the siesa-ui-kit `toast` module — `vi.mock('siesa-ui-kit', async (importOriginal) => ({ ...(await importOriginal()), toast: { success: vi.fn(), error: vi.fn() } }))`).
    - Test — 409 classification: MSW returns 409 with the Problem Details body; assert the `CreateClienteError` object shape (`kind: 'nit-conflict'`, `nitMessage: 'El NIT/RUC ya está registrado'`); assert `toast.success` NOT called.
    - Test — 500 classification: MSW returns 500; assert `kind: 'network'`, `generic.title === 'No se pudo guardar'`; assert `toast.success` NOT called.
    - Test — 400 classification: MSW returns 400 (defense-in-depth — should be unreachable in practice); assert `kind: 'validation'`.

- [x] Task 7 — Frontend Presentation: `ClienteForm` + `ClienteFormDialog` (AC: #1, #3, #4, #6, #7, #8)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` — a controlled form component that hosts React Hook Form + Zod. It renders inputs + inline errors + the top-of-form `Alert` on non-409 network errors:
    ```tsx
    import { useForm } from 'react-hook-form'
    import { zodResolver } from '@hookform/resolvers/zod'
    import { Alert, Button, Input } from 'siesa-ui-kit'
    import { clienteSchema, type ClienteFormValues } from '../application/clienteSchema'
    import type { CreateClienteError } from '../application/useCreateCliente'

    export interface ClienteFormProps {
      onSubmit: (values: ClienteFormValues) => void
      onCancel: () => void
      isSubmitting: boolean
      /** Error surfaced by the mutation — drives inline (409) vs. top-of-form (network) rendering. */
      submitError: CreateClienteError | null
      defaultValues?: Partial<ClienteFormValues>
      submitLabel?: string
    }

    export function ClienteForm({
      onSubmit,
      onCancel,
      isSubmitting,
      submitError,
      defaultValues,
      submitLabel = 'Guardar',
    }: ClienteFormProps) {
      const {
        register,
        handleSubmit,
        formState: { errors },
      } = useForm<ClienteFormValues>({
        resolver: zodResolver(clienteSchema),
        mode: 'onSubmit',
        reValidateMode: 'onChange',
        defaultValues: {
          nombre: defaultValues?.nombre ?? '',
          nit: defaultValues?.nit ?? '',
          telefono: defaultValues?.telefono ?? '',
          ciudad: defaultValues?.ciudad ?? '',
        },
      })

      const showGenericAlert =
        submitError !== null && (submitError.kind === 'network' || submitError.kind === 'validation')

      const nitBackendError =
        submitError !== null && submitError.kind === 'nit-conflict'
          ? submitError.nitMessage
          : undefined

      return (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
          data-testid="cliente-form"
        >
          {showGenericAlert && submitError?.generic && (
            <Alert
              type="destructive"
              title={submitError.generic.title}
              description={submitError.generic.subtitle}
              data-testid="cliente-form-alert"
            />
          )}

          <Field
            id="cliente-nombre"
            label="Nombre"
            error={errors.nombre?.message}
            {...register('nombre')}
            readOnly={isSubmitting}
            autoFocus
          />
          <Field
            id="cliente-nit"
            label="NIT/RUC"
            error={errors.nit?.message ?? nitBackendError}
            {...register('nit')}
            readOnly={isSubmitting}
          />
          <Field
            id="cliente-telefono"
            label="Teléfono"
            error={errors.telefono?.message}
            {...register('telefono')}
            readOnly={isSubmitting}
          />
          <Field
            id="cliente-ciudad"
            label="Ciudad"
            error={errors.ciudad?.message}
            {...register('ciudad')}
            readOnly={isSubmitting}
          />

          <footer className="flex items-center justify-end gap-2 pt-2">
            <Button type="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="default"
              color="primary"
              buttonType="submit"
              aria-busy={isSubmitting}
              disabled={isSubmitting}
              data-testid="cliente-form-submit"
            >
              {submitLabel}
            </Button>
          </footer>
        </form>
      )
    }

    // Local field render helper — kept file-local per Story 2.2's convention.
    function Field(
      props: React.InputHTMLAttributes<HTMLInputElement> & {
        id: string
        label: string
        error?: string
      },
    ) {
      const { id, label, error, ...rest } = props
      const describedBy = error ? `${id}-error` : undefined
      return (
        <div className="space-y-1">
          <label htmlFor={id} className="text-sm font-medium text-slate-900">
            {label}
          </label>
          <Input id={id} aria-invalid={!!error} aria-describedby={describedBy} {...rest} />
          {error && (
            <p id={describedBy} role="alert" className="text-xs text-red-600">
              {error}
            </p>
          )}
        </div>
      )
    }
    ```
    - The `buttonType` prop maps to siesa-ui-kit's underlying HTML `type="submit"` attribute (verify the exact prop name against the kit's `Button.types.d.ts`; if the kit uses a different name — e.g. `htmlType` — adapt accordingly. `Button` cannot rely on the outer form's default because siesa-ui-kit likely renders a `<button type="button">` by default).
    - `readOnly={isSubmitting}` on every input (AC #8 — freeze the form during the network round-trip).
    - `handleSubmit(onSubmit)` runs Zod validation FIRST; the `onSubmit` prop only fires when Zod passes — the request short-circuits on invalid input (AC #3 assertion "MSW handler call count === 0").
    - **Reusable for Story 2.4 (edit)** — `defaultValues` + `submitLabel` props are the extension points Story 2.4 will use. Do NOT hard-code `"Guardar"` inside the JSX.
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteFormDialog.tsx` — a thin shell that owns the dialog open/close state and wires the mutation:
    ```tsx
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
    import { ClienteForm } from './ClienteForm'
    import { useCreateCliente } from '../application/useCreateCliente'
    import type { ClienteFormValues } from '../application/clienteSchema'

    export interface ClienteFormDialogProps {
      open: boolean
      onOpenChange: (open: boolean) => void
    }

    export function ClienteFormDialog({ open, onOpenChange }: ClienteFormDialogProps) {
      const mutation = useCreateCliente()

      const handleSubmit = (values: ClienteFormValues) => {
        mutation.mutate(values, {
          onSuccess: () => {
            mutation.reset()
            onOpenChange(false)
          },
        })
      }

      const handleCancel = () => {
        if (mutation.isPending) return
        mutation.reset()
        onOpenChange(false)
      }

      // Reset any lingering error state when the dialog re-opens fresh.
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
          <DialogContent aria-describedby={undefined} data-testid="cliente-form-dialog">
            <DialogHeader>
              <DialogTitle>Nuevo cliente</DialogTitle>
            </DialogHeader>
            <ClienteForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={mutation.isPending}
              submitError={submitError}
            />
          </DialogContent>
        </Dialog>
      )
    }
    ```
    - `aria-describedby={undefined}` suppresses the shadcn `Dialog` default description warning; the form's inline errors are the semantic replacement.
    - Escape key + overlay click route through `onOpenChange(false)` — the same `handleCancel` path (AC #6).
    - During submit, both `Escape`/overlay and `Cancelar` are gated by `mutation.isPending` — the user cannot half-cancel a request that has already reached the server (AC #8).
  - [ ] Colocate `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`:
    - Test 1 — happy path: fill all four inputs, click Guardar → `onSubmit` prop called once with the four values (trimmed).
    - Test 2 — required-field errors: click Guardar with empty form → four inline errors visible with exact Spanish strings; `onSubmit` prop NOT called.
    - Test 3 — reactivity: fill Nombre only, click Guardar → three errors; type into NIT → NIT error clears in real time (`reValidateMode: 'onChange'`).
    - Test 4 — NIT backend error surfaces inline: prop-drive `submitError = { kind: 'nit-conflict', nitMessage: '...' }` → the exact message renders under the NIT input; NO alert at top.
    - Test 5 — Network error surfaces at top: `submitError = { kind: 'network', generic: {...} }` → `data-testid="cliente-form-alert"` visible with the exact strings; per-field inline errors NOT rendered from `submitError`.
    - Test 6 — freeze on submit: `isSubmitting=true` → all four inputs `readOnly`, Guardar `aria-busy="true"` and `disabled`, Cancelar remains enabled.
    - Test 7 — a11y: focus lands on Nombre on mount; every inline error has `role="alert"`; inputs bind `aria-describedby` to the error node.
  - [ ] Colocate `frontend/src/modules/crm/clientes/presentation/ClienteFormDialog.test.tsx`:
    - Test 1 — closed dialog does not render form (`data-testid="cliente-form"` not in DOM).
    - Test 2 — open dialog: dialog title `"Nuevo cliente"` visible; four inputs visible; Guardar + Cancelar visible.
    - Test 3 — Cancel button calls `onOpenChange(false)`.
    - Test 4 — 201 path: MSW returns 201 → after submit the dialog closes (`onOpenChange(false)` observed) AND `queryClient.invalidateQueries` was called with `['clientes']` AND toast.success called with `"Cliente creado correctamente"`.
    - Test 5 — 409 path: MSW returns 409 → the dialog stays open, the NIT inline error shows the Spanish string, `onOpenChange` NOT called (`false`), toast.success NOT called.
    - Test 6 — 500 path: MSW returns 500 → the top-of-form alert appears, `onOpenChange` NOT called, toast.success NOT called.
    - Test 7 — cancellation during in-flight submit: MSW delayed 200ms; click Guardar then click Cancelar → the mutation is gated (`handleCancel` early-return) and no dialog close is triggered.
    - Test 8 — Escape during in-flight submit is also gated (same rationale).

- [x] Task 8 — Frontend integration: wire `ClienteFormDialog` into `ClienteListView`, enable "Nuevo cliente" button, mount `ToastProvider` (AC: #1, #2, #5)
  - [ ] Edit `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    - Import `useState` (already imported) + `ClienteFormDialog`.
    - Add local state `const [dialogOpen, setDialogOpen] = useState(false)`.
    - Change the `Button` `disabled={true} title="Disponible en Story 2.3"` props to `onClick={() => setDialogOpen(true)}` (drop `disabled` and `title`).
    - Render `<ClienteFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />` at the bottom of the `<aside>` (dialog portals to `document.body` — placement inside the aside is purely for co-location, it does not affect DOM position).
    - Do NOT modify the filter logic, list rendering, or aside styling — Story 2.1 baseline stays untouched (AC #2 relies on the list re-rendering AUTOMATICALLY after `invalidateQueries`).
  - [ ] Edit `frontend/src/app/providers` (or wherever the app's providers live — likely `frontend/src/app/providers/AppProviders.tsx` OR inline in `main.tsx`. Verify via a quick read of `main.tsx` first):
    - Mount siesa-ui-kit's `<ToastProvider position="top-right" />` at the app root, adjacent to `<QueryClientProvider>` and `<RouterProvider>`. If a providers file does not exist, add the provider to `main.tsx` next to the existing `<QueryClientProvider>` block.
    - The `toast.success(...)` call site in `useCreateCliente.ts` depends on this provider being mounted globally — without it, toasts silently no-op.
  - [ ] Contract test — `frontend/src/modules/crm/clientes/application/clienteSchema.contract.test.ts`:
    - Hard-coded array of `[field, badValue, expectedMessage]` tuples:
      ```
      ['nombre',   '',    'El nombre es obligatorio'],
      ['nombre',   '   ', 'El nombre es obligatorio'],
      ['nit',      '',    'El NIT/RUC es obligatorio'],
      ['nit',      '   ', 'El NIT/RUC es obligatorio'],
      ['telefono', '',    'El teléfono es obligatorio'],
      ['telefono', '   ', 'El teléfono es obligatorio'],
      ['ciudad',   '',    'La ciudad es obligatoria'],
      ['ciudad',   '   ', 'La ciudad es obligatoria'],
      ```
    - For each row, build a valid DTO except for the offending field, run `clienteSchema.safeParse(dto)`, assert `success === false` and `error.issues[0].message === expectedMessage`.
    - This is the R-006 (Zod ↔ FluentValidation drift) anchor. If a future refactor changes one side and forgets the other, this test — plus the backend validator tests using the SAME strings — breaks first.

- [x] Task 9 — Frontend routing + integration tests (AC: #1, #2, #5, #13)
  - [ ] Add `frontend/src/routes/clientes.create.test.tsx` — a routing-integration test that renders the router at `/clientes` with MSW handlers, clicks `"Nuevo cliente"`, fills the form, submits, and asserts:
    - The dialog opens.
    - The form's four labels are exactly `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`.
    - After MSW returns 201, the dialog closes AND the new row appears in the left panel (MSW re-serves the updated list on the invalidation-triggered refetch — set up the handler to return `[oldClient, newClient]` on the second `GET`).
    - Toast success is called (spy on siesa-ui-kit's `toast`).
    - Reuse the router-provider helper used by `clientes.$clienteId.test.tsx` (Story 2.2 pattern). Do NOT introduce a new abstraction.
  - [ ] Add duplicate-NIT integration test in the same file:
    - MSW handler for `POST /api/v1/clientes` returns 409 with the RFC 7807 body once, then a valid 201 on the second POST.
    - First submit → assert inline NIT error appears in the DOM with the exact Spanish string; assert the dialog stays open; assert the toast is NOT called.
    - User edits the NIT and re-submits → 201 → dialog closes.
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` — the Story 2.1 assertion "the `Nuevo cliente` button is disabled with `title='Disponible en Story 2.3'`" needs to be REMOVED or REPLACED with an assertion that the button is now clickable and opens the dialog. Do NOT delete unrelated tests. If Story 2.1's Test #12 asserted the disabled state, replace it with:
    ```
    Test 12 — clicking Nuevo cliente opens the ClienteFormDialog (assert `getByRole('dialog')` visible + title "Nuevo cliente").
    ```
  - [ ] Playwright E2E — add `e2e/tests/clientes/story-2-3-create-client.spec.ts`:
    - Uses `page.route('**/api/v1/clientes**', ...)` to stub POST and GET responses.
    - Scenario 1 (P0, R-011): click "Nuevo cliente" → fill 4 fields → submit → assert the new row appears in the list without a page reload; assert the success toast contains `"Cliente creado correctamente"`.
    - Scenario 2 (P0, R-002): submit with a NIT that the stubbed POST returns 409 for → assert the inline NIT error is `"El NIT/RUC ya está registrado"` and no toast fires.
    - Scenario 3 (P0, R-001): assert the 409 response body preview does NOT contain the strings `stackTrace`, `exception`, `SqlException`, `NpgsqlException` (Playwright can read the fetch response body via `page.on('response')`).
    - Reuse the `resetDatabase` / seed helpers Story 2.1's E2E introduced.

- [x] Task 10 — Verification & wrap-up (AC: #12, #13)
  - [ ] `dotnet build backend/SiesaAgents.sln` → 0 errors / 0 new warnings (pre-existing NU1903 suppression stays).
  - [ ] `dotnet test backend/SiesaAgents.sln` → all tests pass (Story 1.x + 2.1 + 2.2 baseline + new 2.3 tests). Coverage `> 80%` on new backend files.
  - [ ] `pnpm --dir frontend typecheck` → 0 errors.
  - [ ] `pnpm --dir frontend test` → all tests pass (previous suites + new Story 2.3 tests). Coverage `> 80%` on new frontend files.
  - [ ] `pnpm --dir frontend build` → succeeds. CSS gzip does not regress by more than +8 KB vs. the Story 2.2 baseline (670.25 KB).
  - [ ] Manual smoke (developer local — optional): `dotnet run --project backend/src/SiesaAgents.API` + `pnpm --dir frontend dev`; open `http://localhost:5173/clientes`, click `Nuevo cliente`, fill 4 fields, submit, verify the row appears in the list AND the toast displays.
  - [ ] Do NOT run `dotnet ef migrations add ...` — Story 2.3 introduces no new tables or columns.
  - [ ] Sprint-status update handled by workflow step-06 (this workflow, not by dev-story).

## Dev Notes

### Architecture Pattern (Clean Architecture — extending existing slice)

Story 2.3 is the first Cliente mutation story. It extends every layer without introducing a new architectural pattern:

- **Backend Domain**: adds `IClienteRepository.AddAsync` + `NitExistsAsync` + `ClienteNitConflictException`.
- **Backend Application**: introduces the first Command + Handler (`CreateClienteCommand` + `CreateClienteCommandHandler`), the first Request DTO (`CreateClienteRequest`) and the first FluentValidation validator (`CreateClienteRequestValidator`).
- **Backend Infrastructure**: implements `AddAsync` + `NitExistsAsync` on `ClienteRepository`.
- **Backend API**: adds `POST /api/v1/clientes` on the existing route group, wires the new endpoint filter `ValidationEndpointFilter<T>`, and extends `ExceptionHandlingMiddleware` with a 409 branch.
- **Frontend Application**: adds the Zod `clienteSchema`, extends the repository interface + implementation with `create`, and introduces the first mutation hook (`useCreateCliente`).
- **Frontend Presentation**: introduces the first form component (`ClienteForm` — designed for reuse by Story 2.4) and the first modal dialog (`ClienteFormDialog`).
- **Frontend Providers**: mounts `ToastProvider` (first toast in the app).

**Explicit non-scope for this story:**

- No PUT / DELETE endpoints (Stories 2.4 / 2.5).
- No optimistic UI (R-005 mitigation is Story 2.4's problem — Story 2.3 relies on the invalidation-triggered refetch).
- No auto-navigation to `/clientes/:newId` after create — Story 2.3 stays on the list view.
- No format validation for NIT / phone / email — the AC only requires FR8 (required-field validation). Format rules are P2 tests and can arrive in a follow-up refinement without breaking Story 2.3's contract.
- No `SortControl` — Story 2.6.
- No `ContactManager` — Epic 3 / Story 4.1.
- No changes to the `clientes` table schema — the `uk_clientes_nit` unique index from Story 2.1 stays as-is.

### Tech Stack & Libraries (mandatory versions per company standards)

- **Backend**: .NET 10 · C# Minimal API · EF Core 10 · **FluentValidation** (new dependency chain — verify `SiesaAgents.Application.csproj` already references `FluentValidation` per Story 1.3 setup; if it does not, add `FluentValidation` there, then `FluentValidation.DependencyInjectionExtensions` on `SiesaAgents.API`).
- **Frontend**: React 19 · TypeScript strict · TanStack Query 5.101+ (mutations) · **React Hook Form 7.81+ + `@hookform/resolvers/zod`** (already installed per `package.json`) · **Zod 4.4+** (already installed) · siesa-ui-kit 1.0.256+ (`Alert`, `Button`, `Input`, `Toast`, `ToastProvider`, `toast`) · shadcn/ui `Dialog` (already scaffolded at `frontend/src/shared/components/ui/dialog.tsx`).
- **Package manager**: `pnpm` — never `npm install`, never `yarn`.
- **Do NOT add**: MediatR, FluentAssertions, `date-fns`, `lodash`, a custom Toast library.

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 — installed at `^1.0.256`).
- **Modal**: shadcn/ui `Dialog` (approved fallback — siesa-ui-kit does not export a generic form-container modal; `AlertDialog` is confirmation-oriented and `MatchModal` / `LinkModal` are domain-specific).
- **Toast**: siesa-ui-kit `Toast` + `ToastProvider` + `toast.success(...)`. Do NOT install a competing library (e.g. sonner, react-hot-toast).
- **Alert (inline top-of-form on network error)**: siesa-ui-kit `Alert`.
- **Buttons**: siesa-ui-kit `Button` — `type="outline"` for Cancelar, `type="default" color="primary"` for Guardar. Match the Story 2.1 `EmptyState` convention that uses the same prop names.
- **Inputs**: siesa-ui-kit `Input`. Never hand-roll `<input>` markup for a form field when the kit exports one.
- **Icons**: no new icons required. If any decorative icon is added, use Heroicons (Story 2.1 / 2.2 convention).
- **Spanish text**: every visible string, `aria-label`, `placeholder`, toast, error message is Spanish. Code (variables, functions, types) stays English.
- **ARIA rules from UX spec §Accessibility**:
  - Dialog root: shadcn `Dialog` already applies `role="dialog"` + `aria-modal="true"`; the `DialogTitle` supplies the accessible name.
  - Form errors: each error node has `role="alert"` and is bound to its input via `aria-describedby`.
  - Submit-in-progress: Guardar button has `aria-busy="true"`; inputs have `readOnly` + `aria-readonly="true"` (via the browser default on `readOnly`).
  - Focus management: focus lands on Nombre on dialog open (`autoFocus` on the first Field); shadcn `Dialog` handles focus-trap and Escape-to-close automatically.

### MasterCrud enforcement — DEFERRED (extends the Story 2.1/2.2 rationale)

Story 2.1 documented the deferral in depth (server pagination + table-first + `IServiceAdapter` shape are all misaligned with the split-panel + detail card composition prescribed by the architecture doc). Story 2.3 preserves that deferral:

1. Story 2.3 introduces a **create form only** — no table (the list is Story 2.1's `ClienteListView`, already deferred). MasterCrud always brings its own toolbar + table when instantiated.
2. Story 2.3 is a **modal dialog**, not an embedded panel. MasterCrud's navigation types (`modal`, `sidebar`, `page`) all require the parent to hand it a `CrudService<T>` — which would then compete with the existing `clienteApiRepository` + TanStack Query cache seams that Stories 2.1/2.2 baked in.
3. No `activeByCompany`, `companies`, `formColumns`, `lookupConfig` semantics are needed — Cliente is a flat 4-field entity.

If a later epic adds a multi-company or tabular entity, MasterCrud becomes the natural fit for THAT screen. Not for Cliente CRUD in Epic 2.

This deviation is authorised by the architecture doc + Story 2.1/2.2 Change Log; add it to Story 2.3's Change Log too if `sa-code-review` re-flags it.

### Backend Critical Rules (per company standards)

- **UUID PK**: `ClienteEntity.Create` mints a fresh `Guid.NewGuid()` (Story 2.1 established this). No caller passes an id.
- **`DateTimeOffset`** only — `ClienteEntity.Create` sets both `CreatedAt` and `UpdatedAt` to `DateTimeOffset.UtcNow`. NEVER `DateTime`.
- **snake_case naming** — automatic via `UseSnakeCaseNamingConvention()`. No new config touchpoints.
- **Scalar** for API docs — the new `POST` endpoint inherits the `Clientes` tag from the route group.
- **Problem Details RFC 7807** — 400s come from `Results.ValidationProblem`, 409 from the middleware branch, all other 5xx from the existing `ExceptionHandlingMiddleware` (Story 1.3). Do NOT return raw exception messages anywhere. Do NOT include `stackTrace` / `exception` keys — the tests assert this negatively (NFR6, R-001).
- **CQRS**: reads use Queries (Stories 2.1/2.2), writes use Commands (Story 2.3 onwards). Direct handlers, no MediatR.
- **`AddValidatorsFromAssemblyContaining`** picks up every `AbstractValidator<>` in the Application assembly automatically — future validators (Update / Delete / Contacto) will not need extra DI wiring.

### Frontend Critical Rules (per company standards)

- **Zustand: NOT USED** — the dialog open/close state is local `useState` (component-level); form state is React Hook Form (component-level); server state is TanStack Query. Zustand is reserved for cross-route ephemeral state, which does not exist here.
- **TanStack Query keys**:
  - Invalidate `['clientes']` on success — the canonical list key from Story 2.1.
  - Do NOT invalidate `['clientes', id]` — no single-cliente cache exists for a freshly-created row.
- **`useMutation` classification**: keep the `mutationFn` free of UI concerns (only `classifyCreateError`); side-effects live in `onSuccess` / component-side handlers.
- **All user-facing text in Spanish**. Code stays English. Every string called out in AC #3 / #4 / #7 is load-bearing — tests assert verbatim.
- **Never `error.message`**: `useCreateCliente` classifies AxiosError shapes into `CreateClienteError` and hands the form a curated object. The form never touches `error.message`.
- **React Hook Form `mode: 'onSubmit'` + `reValidateMode: 'onChange'`**: matches the UX spec § "Inline validation: required fields show error on blur if empty" (blur → onChange after first submit — the UX intent is post-first-error real-time feedback, which `onChange` reValidate satisfies without triggering error noise before the user has finished typing).
- **`AbortSignal` plumbing**: `clienteApiRepository.create` accepts an optional `signal` per the IClienteRepository contract. The mutation hook does NOT thread the mutation's cancellation signal today (TanStack Query 5's `useMutation` does not expose a per-mutation signal by default) — deferring signal-driven cancellation to a follow-up if the AC #8 cancellation test observes a leak.

### API Contract Details (RFC 7807 + camelCase JSON)

**Request body (POST /api/v1/clientes):**

```json
{ "nombre": "Acme Corp", "nit": "900123456", "telefono": "+57 300 123 4567", "ciudad": "Cali" }
```

**Success (201):**

```
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/v1/clientes/9c1e5f5b-...-...

{
  "id": "9c1e5f5b-...-...",
  "nombre": "Acme Corp",
  "nit": "900123456",
  "telefono": "+57 300 123 4567",
  "ciudad": "Cali",
  "createdAt": "2026-07-08T12:34:56.789+00:00",
  "updatedAt": "2026-07-08T12:34:56.789+00:00"
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

**NIT conflict (409):**

```
HTTP/1.1 409 Conflict
Content-Type: application/problem+json

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Conflict",
  "status": 409,
  "detail": "El NIT/RUC ya está registrado",
  "instance": "/api/v1/clientes"
}
```

### Testing Standards

**Backend:**

- Framework: xUnit + `Microsoft.AspNetCore.Mvc.Testing` (already installed).
- Raw `Assert.*` — do NOT introduce `FluentAssertions`.
- Fake repository pattern (hand-rolled `IClienteRepository` implementation) — extend the existing Story 2.1/2.2 fake in place with `AddAsync` + `NitExistsAsync`. Track invocation counters (`addAsyncCalls`, `nitExistsAsyncCalls`) so tests can assert "AddAsync never called" on 409 (AC #11 defence-in-depth).
- Endpoint tests use `WebApplicationFactory<Program>` + `.UseEnvironment("Testing")` + service-override of `IClienteRepository` — same pattern as Stories 2.1/2.2.
- Assert anti-leak clauses on 400/409 (NFR6, R-001): body contains `"title"` and `"status"` but does NOT contain `"stackTrace"`, `"exception"`, or the developer-facing exception message (`"NIT with"` substring is a good sentinel).
- Coverage target: `> 80%` on new backend files.

**Frontend:**

- Framework: Vitest + `@testing-library/react` + `@testing-library/jest-dom` + MSW.
- Reuse `renderWithProviders` if Story 2.2 introduced it; otherwise use the ad-hoc `QueryClientProvider` + `RouterProvider` pattern from `clientes.$clienteId.test.tsx`.
- **Mock siesa-ui-kit's `toast`** in every test that exercises `useCreateCliente` — `vi.mock('siesa-ui-kit', async (importOriginal) => ({ ...(await importOriginal<typeof import('siesa-ui-kit')>()), toast: { success: vi.fn(), error: vi.fn() } }))`.
- **MSW handlers** — matcher URL `*/api/v1/clientes` with `HttpResponse.json({...}, { status: 201 })` for the happy path; return the 409 Problem Details body verbatim for the duplicate-NIT test; return 500 for the network-error test.
- Assertions on Spanish strings must be exact-string matchers (`getByText('Cliente creado correctamente')`), not case-insensitive matchers.
- Coverage target: `> 80%` on new frontend files.

**Contract Anchor (R-006 — Zod ↔ FluentValidation parity):**

- Both `CreateClienteRequestValidatorTests.cs` and `clienteSchema.contract.test.ts` iterate the SAME `[field, badValue, expectedMessage]` table (hand-copied — no shared fixture — to keep the parity check independent).
- If either side is refactored and the strings drift, one of these two suites breaks first, catching R-006 at PR time.

**Location:**

- Backend: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`, `CreateClienteRequestValidatorTests.cs`, `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsCreateTests.cs`, `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddleware_NitConflictTests.cs`.
- Frontend: colocated `clienteSchema.contract.test.ts`, `useCreateCliente.test.ts`, `ClienteForm.test.tsx`, `ClienteFormDialog.test.tsx`, plus `frontend/src/routes/clientes.create.test.tsx` and `e2e/tests/clientes/story-2-3-create-client.spec.ts`.

### File Structure (paths this story creates or edits)

```
backend/
  src/
    SiesaAgents.API/
      Endpoints/
        ClienteEndpoints.cs                                # EDIT — add MapPost + AddEndpointFilter
        ValidationEndpointFilter.cs                        # NEW
      Middleware/
        ExceptionHandlingMiddleware.cs                     # EDIT — add 409 branch for ClienteNitConflictException
      Program.cs                                           # EDIT — DI: CreateClienteCommandHandler + AddValidatorsFromAssemblyContaining
      SiesaAgents.API.csproj                               # EDIT (if needed) — add FluentValidation.DependencyInjectionExtensions
    SiesaAgents.Application/
      Clientes/
        Commands/
          CreateClienteCommand.cs                          # NEW
          CreateClienteCommandHandler.cs                   # NEW
        DTOs/
          CreateClienteRequest.cs                          # NEW
        Validators/
          CreateClienteRequestValidator.cs                 # NEW
    SiesaAgents.Domain/
      Clientes/
        Exceptions/
          ClienteNitConflictException.cs                   # NEW
        Interfaces/
          IClienteRepository.cs                            # EDIT — add AddAsync + NitExistsAsync
    SiesaAgents.Infrastructure/
      Repositories/
        ClienteRepository.cs                               # EDIT — implement AddAsync + NitExistsAsync
  tests/
    SiesaAgents.UnitTests/
      Application/
        Clientes/
          CreateClienteCommandHandlerTests.cs              # NEW
          CreateClienteRequestValidatorTests.cs            # NEW
      Api/
        ClienteEndpointsCreateTests.cs                     # NEW
        ClienteEndpointsTests.cs                           # EDIT — extend inline fake with AddAsync + NitExistsAsync counters
      Middleware/
        ExceptionHandlingMiddleware_NitConflictTests.cs    # NEW (or extend existing middleware test file)

frontend/
  src/
    routes/
      clientes.create.test.tsx                             # NEW
    modules/
      crm/
        clientes/
          application/
            clienteSchema.ts                               # NEW
            clienteSchema.contract.test.ts                 # NEW
            useCreateCliente.ts                            # NEW
            useCreateCliente.test.ts                       # NEW
          domain/
            IClienteRepository.ts                          # EDIT — add create()
          infrastructure/
            clienteApiRepository.ts                        # EDIT — implement create()
          presentation/
            ClienteListView.tsx                            # EDIT — enable Nuevo cliente + mount dialog
            ClienteListView.test.tsx                       # EDIT — replace the disabled-button assertion with an "opens dialog" assertion
            ClienteForm.tsx                                # NEW
            ClienteForm.test.tsx                           # NEW
            ClienteFormDialog.tsx                          # NEW
            ClienteFormDialog.test.tsx                     # NEW
    main.tsx OR app/providers/                             # EDIT — mount siesa-ui-kit ToastProvider

e2e/
  tests/
    clientes/
      story-2-3-create-client.spec.ts                      # NEW
```

### Project Structure Notes

- Aligns with the architecture doc's target tree (line 471 — `useCreateCliente.ts` under `application/`, line 474 — `clienteSchema.ts`, line 480 — `ClienteForm.tsx` under `presentation/`).
- `ClienteFormDialog.tsx` is NOT in the architecture doc's original file list — it is a thin, story-scoped shell created here to keep `ClienteForm` free of dialog concerns (Story 2.4 will reuse `ClienteForm` inside an inline edit surface, NOT a dialog — separating the two now avoids refactoring later).
- `ValidationEndpointFilter.cs` is a cross-cutting utility living inside `SiesaAgents.API/Endpoints/`. If a future story adds a second validator-driven endpoint outside `ClienteEndpoints`, the filter class stays; if the API gets three or more validators, consider promoting it to `Shared/Infrastructure` per company standards.
- **Deviation vs. architecture doc**: the doc's `useUpdateCliente.ts` + `useDeleteCliente.ts` are NOT created by Story 2.3 — they belong to Stories 2.4 / 2.5 respectively. Story 2.3 ships ONLY `useCreateCliente.ts`.
- **No architecture violation**: no new Zustand store, no new global QueryClient, no changes to `apiClient` / `queryClient` singletons.

### Contextual Intelligence

**Previous Story Learnings (1.1 + 1.3 + 2.1 + 2.2):**

- Story 1.3 established `ExceptionHandlingMiddleware` — Story 2.3 extends it with a `ClienteNitConflictException` catch branch. The middleware is idempotent + additive; adding a `catch` above the generic exception catch is the correct extension point.
- Story 2.1 declared the `uk_clientes_nit` unique index — the DB-level defense stays as-is; Story 2.3's application-level check is complementary, not redundant (defense-in-depth per R-002).
- Story 2.1 declared `IClienteRepository.GetByIdAsync` upfront to avoid churn — Story 2.3 follows the same discipline: `AddAsync` and `NitExistsAsync` are added now (used) but `UpdateAsync`/`DeleteAsync` are NOT declared until Story 2.4/2.5 actually consume them.
- Story 2.1's inline `FakeClienteRepository` currently lives in `ClienteEndpointsTests.cs`; Story 2.3 extends it in place. The optional refactor to lift it into `backend/tests/SiesaAgents.UnitTests/Fakes/` was flagged by the Story 2.2 review — Story 2.3 leaves the refactor to Story 2.4 or 2.5, where three test files would be modifying the same inline fake concurrently.
- Story 2.2 introduced the `zod` v4 dependency and used a regex UUID validator due to Zod v4's stricter RFC 4122 checks — Story 2.3 does NOT use UUID validation on the create schema (the id is server-generated), so the Zod v4 quirk is not relevant here.
- Story 2.2 established `retry: false` on the read hook so that 404 short-circuits the not-found branch. Story 2.3's mutation does NOT set `retry` — TanStack Query defaults to `retry: 0` for mutations, which is what Story 2.3 wants (no auto-retry on 409/400 — the user drives the retry via the button).
- Story 2.1's `ClienteListView` renders a `disabled` `Nuevo cliente` button with `title="Disponible en Story 2.3"`. Story 2.3 MUST enable it. Story 2.1's test #12 (or wherever it asserts the disabled state) needs a matching update.
- Story 2.2's ATDD phase demonstrated the routing-integration test pattern at `frontend/src/routes/clientes.$clienteId.test.tsx` — Story 2.3 reuses that pattern for `clientes.create.test.tsx`. Do NOT invent a new test harness.
- Package manager: `pnpm` — never `npm install`. `siesa-ui-kit`'s `toast` API is exported from the same barrel as `Button`/`Input` — a single import statement covers all Story 2.3 needs.

**Git History Context:**

- Story 2.1 landed as `feat(story-2.1): add cliente list view and search`, Story 2.2 as `feat(story-2.2): add cliente detail view with deep-link and not-found handling`. Follow the same convention: `feat(story-2.3): add cliente create form with nit-conflict handling`.
- Commit messages: English, past tense (per Story 2.2 note).
- Small commits per Task (Domain → Infrastructure → Application → API → Tests → Frontend Application → Frontend Presentation → Frontend Integration → Verification).
- Spanish user-facing text, English code — Story 2.1 / 2.2 convention.

**Latest Tech Info:**

- `react-hook-form@7.81.x` — `useForm({ resolver: zodResolver(schema), mode: 'onSubmit', reValidateMode: 'onChange' })` is the canonical wiring. `formState.errors.<field>?.message` returns the Zod message directly.
- `@hookform/resolvers@5.4.x` — `zodResolver` supports Zod v4 without config changes (both are installed).
- `@tanstack/react-query@5.101.x` — `useMutation` supports typed error via the `TError` generic; the classification helper pattern (`try/catch → throw typed`) is idiomatic. `mutation.reset()` clears both `data` and `error` — call it on dialog cancel + on success.
- `siesa-ui-kit@^1.0.256` — exports `Toast`, `ToastProvider`, `toast` (verified in `dist/index.d.ts`). `ToastProvider` accepts `position="top-right" | ...`; default is likely `bottom-right`. `Alert` exports `AlertProps` with a `type` prop (verify variant names — the code above uses `"destructive"` which may need to be adapted to the kit's actual variant enum).
- `shadcn/ui Dialog` at `frontend/src/shared/components/ui/dialog.tsx` — already installed. `<Dialog open={o} onOpenChange={...}>` + `<DialogContent><DialogHeader><DialogTitle>...</DialogTitle></DialogHeader>...</DialogContent></Dialog>` is the composition; escape + overlay click route through `onOpenChange(false)` automatically.
- `FluentValidation@11+` — `NotEmpty()` rejects null / empty string / whitespace-only strings out of the box (matches Zod `.trim().min(1)`).
- `FluentValidation.DependencyInjectionExtensions@11+` — `AddValidatorsFromAssemblyContaining<T>()` registers every `AbstractValidator<>` in the assembly as scoped.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.3]
- PRD FRs FR1, FR7, FR8, FR27 covered: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md]
- Architecture — POST `/api/v1/clientes`: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — Optimistic mutation + invalidation pattern (`invalidateQueries(['clientes'])` + Spanish toast): [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- Architecture — Requirements to Structure Mapping (FR1 → `ClienteForm.tsx` + `useCreateCliente.ts` + `CreateClienteCommandHandler.cs`, FR7 → `CreateClienteRequestValidator.cs` + `clienteSchema.ts`): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- Architecture — REST response shapes (POST → 201 + Location + object; Error → Problem Details RFC 7807): [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- Architecture — Complete Project Directory Structure (backend `Clientes/Commands/`, `Clientes/Validators/`; frontend `useCreateCliente.ts`, `clienteSchema.ts`, `ClienteForm.tsx`): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Enforcement Guidelines (Spanish text, UUID PK, `DateTimeOffset`, Problem Details, Scalar not Swagger): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- UX Spec — Journey 2 (Nuevo cliente parking-lot flow, toast copy, 4 required fields, single-screen form): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 2]
- UX Spec — Secondary Flow: New Client Registration (Spanish copy for validation, toast, buttons): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Secondary Flow]
- UX Spec — Typography (form labels `text-sm font-medium`), Colors (Primary #0e79fd for CTAs), Accessibility (44px touch targets, aria-describedby): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation]
- Test design Epic 2 — P0 R-001 (error exposure), R-002 (409 + Spanish 'El NIT/RUC ya está registrado'), R-006 (Zod ↔ FluentValidation drift), R-011 (invalidateQueries after mutation), R-012 (Spanish toast): [Source: _bmad-output/test-design-epic-2.md]
- Company standards — Clean Architecture layers, UUID PK, `DateTimeOffset`, Spanish UI text, FluentValidation (backend) + Zod (frontend), Scalar for API docs: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Company standards — MasterCrud reference (deferral rationale documented above): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- Previous story 2.1 (`ClienteEntity.Create`, `IClienteRepository` shape, `uk_clientes_nit` unique index, `Nuevo cliente` placeholder button, `apiClient`/`queryClient` singletons, `CLIENTES_QUERY_KEY = ['clientes']`, `FakeClienteRepository` pattern): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Previous story 2.2 (routing-integration test pattern at `clientes.$clienteId.test.tsx`, `zod` v4 dependency, siesa-ui-kit `Button type="outline"` convention from `ClienteNotFound`): [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md]
- Previous story 1.3 (`ExceptionHandlingMiddleware` + `UseStatusCodePages` for Problem Details RFC 7807): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (claude-opus-4-7)

### Debug Log References

- Backend build: `dotnet build backend/SiesaAgents.sln` → 0 warnings / 0 errors.
- Backend tests: `dotnet test backend/SiesaAgents.sln` → 143 passed / 0 failed.
- Frontend typecheck: `pnpm --dir frontend typecheck` → 0 errors.
- Frontend tests: `pnpm --dir frontend test` → 279 passed / 0 failed.
- Frontend build: `pnpm --dir frontend build` → success, CSS gzip 670.26 KB (parity with 670.25 KB Story 2.2 baseline — no regression).

### Completion Notes List

- **Backend Domain**: extended `IClienteRepository` with `AddAsync` and `NitExistsAsync`; added sealed `ClienteNitConflictException` in `SiesaAgents.Domain.Clientes.Exceptions`.
- **Backend Infrastructure**: implemented `AddAsync` (with `SaveChangesAsync`) and `NitExistsAsync` (`AsNoTracking` + `AnyAsync`) on `ClienteRepository`.
- **Backend Application**: added `CreateClienteRequest` DTO, `CreateClienteCommand` + `CreateClienteCommandHandler` (application-level NIT check before entity creation), and `CreateClienteRequestValidator` with FluentValidation Spanish messages matching Zod verbatim (R-006).
- **Backend API**: added `POST /api/v1/clientes` endpoint using generic `ValidationEndpointFilter<T>`; extended `ExceptionHandlingMiddleware` with a `ClienteNitConflictException` branch producing RFC 7807 409 body with Spanish detail and no leaks (NFR6). Added `FluentValidation.DependencyInjectionExtensions` 12.1.1 to the API project; DI wired via `AddScoped<CreateClienteCommandHandler>()` + `AddValidatorsFromAssemblyContaining<CreateClienteRequestValidator>()`.
- **Frontend Application**: added Zod `clienteSchema` (parity with backend), `useCreateCliente` mutation hook classifying axios errors into `CreateClienteError` shapes (`nit-conflict` / `validation` / `network`), invalidating `['clientes']` and firing `toast.success('Cliente creado correctamente')` on success.
- **Frontend Infrastructure**: extended `IClienteRepository` + `clienteApiRepository` with `create(payload, signal)`.
- **Frontend Presentation**: introduced reusable `ClienteForm` component (RHF + zodResolver, `mode: 'onSubmit'` + `reValidateMode: 'onChange'`, inputs go read-only during submit, Cancelar stays enabled) and `ClienteFormDialog` shell (shadcn Dialog with `onOpenChange` gating during in-flight submit). Wired the dialog into `ClienteListView` and enabled the previously-disabled "Nuevo cliente" button.
- **Frontend Providers**: mounted `<ToastProvider>` in `main.tsx` above `<RouterProvider>` — required for `toast.success(...)` to render at runtime.
- **Existing tests**: extended all Story 2.1/2.2 in-line `FakeClienteRepository` classes with default no-op implementations of `AddAsync` / `NitExistsAsync` so they still satisfy the updated interface. Story 2.1's "POST returns 404/405" edge test was updated to assert the new positive-shape 400 ValidationProblem contract. Story 2.1's "Nuevo cliente disabled" test was flipped to assert the button is now enabled and opens the dialog.
- **Test infrastructure**: the ATDD-generated tests used top-level mock spies referenced from a hoisted `vi.mock` factory. Refactored to `vi.hoisted()` so vitest's hoisting works. Also updated the routing-integration tests to disambiguate "Nuevo cliente" (present as both the button and the dialog title) via `data-testid="cliente-form-dialog"`.
- No optimistic UI, no auto-navigation to `/clientes/:newId`, no NIT/phone format validation — all explicitly out-of-scope per story Dev Notes.
- Manual smoke, DB migration steps and commits are intentionally skipped (per task instructions the story is left in `review` state without committing).

### File List

**Backend — new:**
- `backend/src/SiesaAgents.Domain/Clientes/Exceptions/ClienteNitConflictException.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`
- `backend/src/SiesaAgents.API/Endpoints/ValidationEndpointFilter.cs`

**Backend — modified:**
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- `backend/src/SiesaAgents.API/Program.cs`
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj`
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsTests.cs` (fake repo updated)
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsEdgeTests.cs` (fake repo + POST test updated)
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsGetByIdTests.cs` (fake repo updated)
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsGetByIdEdgeTests.cs` (fake repo updated)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` (fake repo updated)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerEdgeTests.cs` (fakes updated)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` (fake repo updated)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerEdgeTests.cs` (fakes updated)

**Backend — ATDD tests (pre-existing from RED phase, now GREEN):**
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteRequestValidatorTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsCreateTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddleware_NitConflictTests.cs`

**Frontend — new:**
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteFormDialog.tsx`

**Frontend — modified:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.edge.test.tsx` (flipped Nuevo cliente assertion)
- `frontend/src/main.tsx` (mounted ToastProvider)

**Frontend — ATDD tests (pre-existing from RED phase, now GREEN; minor `vi.hoisted()` refactor):**
- `frontend/src/modules/crm/clientes/application/clienteSchema.contract.test.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteFormDialog.test.tsx`
- `frontend/src/routes/clientes.create.test.tsx`

**Sprint status:**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (`2-3-create-client`: `ready-for-dev` → `review`)
