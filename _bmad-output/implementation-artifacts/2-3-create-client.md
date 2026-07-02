# Story 2.3: Create Client

Status: implemented

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new client by filling in a form,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** el usuario está en `/clientes` (viewport desktop ≥ 1024px o móvil), **When** la vista se renderiza, **Then** en el header del panel izquierdo (`ClienteListView`, junto al título `Clientes`) se muestra un botón primario `siesa-ui-kit` `Button` con texto `"Nuevo cliente"` (`data-testid="cliente-nuevo-button"`, `aria-label="Nuevo cliente"`), visible **incluso cuando la lista está vacía** (además del CTA idéntico dentro del `EmptyState` variant `no-clients` — ambos disparadores abren el mismo formulario). Al hacer click sobre cualquiera de los dos, el estado local del contenedor pasa `isFormOpen=true` y se abre el modal `ClienteFormModal` en modo `"create"` con los 4 campos vacíos y foco automático en `Nombre`. (FR1, UX spec — Phase 2 "Prominent Nuevo cliente button" — mitiga R-005 al canalizar toda creación por un único CTA)

2. **Given** el modal `ClienteFormModal` está abierto en modo `"create"`, **When** el usuario lo ve, **Then** el `siesa-ui-kit` `AlertDialog` (`size="max-w-md"`, `isOpen=true`, `showCloseButton=true`, `preventCloseOnOverlayClick=false`, `title="Nuevo cliente"`, `hideCancel=true` — los botones son inyectados vía `actions`, no los defaults del kit) contiene un `<form>` con **exactamente cuatro** campos `siesa-ui-kit` `Input` apilados verticalmente en el siguiente orden: `Nombre*`, `NIT/RUC*`, `Teléfono*`, `Ciudad*`. Cada `Input` tiene:
   - `label={campo}` visible con asterisco rojo indicando obligatoriedad,
   - `aria-required="true"`,
   - `type="text"` (todos son texto libre; `NIT/RUC` se **normaliza** en el backend, no en el frontend, para no bloquear formatos internacionales — el frontend sólo hace `trim`),
   - `data-testid` estable: `cliente-form-nombre`, `cliente-form-nit`, `cliente-form-telefono`, `cliente-form-ciudad`,
   - **maxLength** consistente con backend: `200 / 50 / 50 / 100` respectivamente (per `ClienteConfiguration`).

   Al pie del `<form>`, en `actions` del `AlertDialog`, dos botones `siesa-ui-kit` `Button`:
   - `"Cancelar"` — `type="button"`, `variant="outline"`, `data-testid="cliente-form-cancel"`, cierra el modal sin submit;
   - `"Guardar"` — `type="submit"`, `variant="default"` (`primary-600`), `data-testid="cliente-form-submit"`, `disabled={isSubmitting || !isValid}`.

   Debajo de los inputs se renderiza la leyenda `"* Campos obligatorios"` en `text-xs text-slate-500` (UX spec — Form Patterns). (FR1, FR8 — UX spec Form Patterns — test-design-epic-2 P0#9)

3. **Given** el modal `ClienteFormModal` está abierto y el usuario envía el `<form>` con **uno o más campos requeridos vacíos o solo espacios en blanco**, **When** `handleSubmit` se dispara, **Then** React Hook Form (integrado con `zodResolver(clienteSchema)`) impide la llamada HTTP (`onSubmit` **no se ejecuta**) y muestra debajo de cada campo inválido un mensaje inline en `text-sm text-red-600`:
   - `Nombre` vacío/whitespace → `"El nombre es requerido"`,
   - `NIT/RUC` vacío/whitespace → `"El NIT/RUC es requerido"`,
   - `Teléfono` vacío/whitespace → `"El teléfono es requerido"`,
   - `Ciudad` vacío/whitespace → `"La ciudad es requerida"`.

   Cada mensaje se asocia al `Input` correspondiente vía `aria-describedby="{field}-error"` y `aria-invalid="true"`. El foco visual del primer campo con error queda con `borde red-500` (via variante error del `Input` de siesa-ui-kit). La validación se dispara `onBlur` de cada campo (patrón UX spec — Feedback Patterns — Validación inline) y también en `onSubmit`. Cuando el campo vuelve a ser válido (`onChange` tras primer error), el mensaje desaparece automáticamente. **Ninguna petición POST** llega al backend en este caso — verificable con MSW request counter. (FR8, AC-E2.4, NFR5 — R-012 mitigation — test-design-epic-2 P0#9)

4. **Given** el usuario ha llenado los 4 campos con valores válidos y hace click en `"Guardar"`, **When** `handleSubmit` valida OK y ejecuta la mutación `useCreateCliente`, **Then**:
   - el frontend envía `POST /api/v1/clientes` con body JSON camelCase `{ nombre, nit, telefono, ciudad }` — todos los strings previamente `.trim()`-eados por Zod (`z.string().trim().min(1, "…es requerido")`);
   - el botón `"Guardar"` pasa a `disabled` + muestra label `"Guardando..."` (UX responsive feedback);
   - el backend responde `201 Created` con `Location: /api/v1/clientes/{newId}` y body `ClienteDto` completo (id, nombre, nit, telefono, ciudad, createdAt, updatedAt);
   - la mutación en `onSuccess` (a) invalida `queryClient.invalidateQueries({ queryKey: ['clientes'] })` para refrescar la lista (FR27, R-004 mitigation) — y (b) inserta el nuevo cliente al **inicio del cache existente** vía `setQueryData(['clientes'], (prev) => [dto, ...(prev ?? [])])` como optimistic append (evita el flash de refetch) mientras el `invalidate` fuerza reconciliación con el servidor;
   - el modal se cierra (`setIsFormOpen(false)`) y el formulario se resetea (`form.reset()`);
   - se dispara `toast.success("Cliente creado correctamente", { position: "bottom-right", duration: 3000, color: "green" })` (siesa-ui-kit `toast`);
   - el `ClienteListItem` del cliente recién creado aparece **al inicio** de la lista dentro del panel (FR27, NFR2 — reflejo < 2s).

   (FR1, FR27, NFR2, AC-E2.1 — test-design-epic-2 P0#1, P0#7)

5. **Given** el usuario envía el formulario con un `NIT/RUC` que ya existe en la base de datos, **When** el backend detecta la violación del índice único `uk_clientes_nit` y responde `409 Conflict` con Problem Details RFC 7807 (`type`, `title: "NIT/RUC duplicado"`, `status: 409`, `detail: "Ya existe un cliente con el NIT/RUC indicado."`, `instance: /api/v1/clientes`, `extensions: { field: "nit" }`), **Then** el frontend intercepta la respuesta en `useCreateCliente.onError`:
   - **No** cierra el modal — el usuario mantiene el formulario para poder corregir el NIT/RUC;
   - Marca el campo `NIT/RUC` con `aria-invalid="true"` + `borde red-500`, y muestra el mensaje inline `"El NIT/RUC ya está registrado"` **debajo del input** — texto **exacto**, sin exponer `detail`, `type`, `instance` ni ningún otro campo del Problem Details (NFR6);
   - El botón `"Guardar"` vuelve a `disabled=false` con label `"Guardar"`;
   - **NO** se dispara un toast rojo — el error 409 es un error de validación de negocio y su tratamiento correcto es inline (patrón UX spec — Feedback Patterns: campo con error específico → inline; error genérico de red → toast).
   - El mensaje "El NIT/RUC ya está registrado" es el **único** string mostrado al usuario final; ningún stack trace, mensaje interno del backend, ni ruta técnica llega al DOM (NFR6 audit).

   (NFR6, AC-2.3 último AC del épico — R-002 mitigation — test-design-epic-2 P0#3, P0#4)

6. **Given** el backend está inalcanzable (5xx, network error, timeout) durante la submission, **When** la mutación reporta `isError === true` con `error.response?.status ∉ {400, 409}` (o sin respuesta HTTP), **Then**:
   - el modal permanece abierto y los campos conservan sus valores (el usuario no pierde su entrada);
   - se dispara `toast.error("No se pudo guardar. Intenta de nuevo.", { position: "bottom-right", duration: 5000, color: "red" })` (siesa-ui-kit `toast` — UX spec Feedback Patterns tabla "Error de red (save)");
   - el botón `"Guardar"` vuelve a `disabled=false`;
   - **NO** se muestra el `detail` técnico ni stack trace (NFR6). Los errores 400 con Problem Details que **no sean** 409 (ej: validación server-side extra que el frontend no anticipó) siguen el mismo path del toast rojo pero con `title` del Problem Details como copy — dado que FluentValidation ya cubre los mismos campos que Zod, esta rama es defensiva y no se ejercita en flujos normales. (NFR6, UX spec — Error & Recovery Patterns)

7. **Given** el backend expone `POST /api/v1/clientes`, **When** el frontend hace la petición con body JSON válido, **Then** el endpoint responde:
   - **201 Created** + `Location: /api/v1/clientes/{id}` + body `ClienteDto` (id, nombre, nit, telefono, ciudad, createdAt, updatedAt — el mismo shape que ya usan GET list/detail) cuando la creación fue exitosa;
   - **400 Bad Request** con Problem Details RFC 7807 (`errors: { nombre?: string[], nit?: string[], telefono?: string[], ciudad?: string[] }`) cuando algún campo requerido está vacío, whitespace-only, o excede el `MaxLength` (200/50/50/100). FluentValidation se ejecuta **antes** de tocar la base de datos;
   - **409 Conflict** con Problem Details (`title: "NIT/RUC duplicado"`, `status: 409`, `detail: "Ya existe un cliente con el NIT/RUC indicado."`, `extensions: { field: "nit" }`) cuando la persistencia falla por violación del índice `uk_clientes_nit` (mapeado desde `DbUpdateException` cuya inner exception es `Npgsql.PostgresException` con `SqlState == "23505"`).

   Implementación .NET 10 Minimal API + EF Core 10 siguiendo Clean Architecture + DDD/CQRS:
   - **Domain**: `IClienteRepository.AddAsync(ClienteEntity, CancellationToken)` + `SaveChangesAsync(CancellationToken)` — o método atómico `AddAndSaveAsync` (ver Task 2 para la decisión final). `ClienteEntity.Create(...)` (ya existente desde Story 2.1) enforza invariantes de dominio y realiza `.Trim()` server-side de defensa.
   - **Application/CQRS**: `CreateClienteCommand(string Nombre, string Nit, string Telefono, string Ciudad)` + `CreateClienteCommandHandler.HandleAsync` que (a) llama `ClienteEntity.Create(...)`, (b) persiste vía repo, (c) captura `DbUpdateException` con `PostgresException.SqlState == "23505"` y **lanza `DuplicateNitException`** (excepción de dominio de negocio, definida en `SiesaAgents.Domain.Clientes.Exceptions`), (d) retorna el `ClienteDto` del nuevo agregado.
   - **Application/Validators**: `CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>` (FluentValidation) con reglas: `.NotEmpty().MaximumLength(N).Matches("...")` (regex opcional para NIT/RUC — ver Task 3). Registrado en DI vía `builder.Services.AddScoped<IValidator<CreateClienteRequest>, CreateClienteRequestValidator>()`.
   - **Infrastructure**: `ClienteRepository.AddAsync(ClienteEntity, CancellationToken)` que hace `_db.Clientes.Add(entity)` + `SaveChangesAsync`. La captura de `DbUpdateException` ocurre en el **handler** (Application layer) — no en el repositorio — porque la política (409 vs. otro error) es una decisión de aplicación, no de infraestructura.
   - **API**: Endpoint `group.MapPost("/", async (CreateClienteRequest req, IValidator<CreateClienteRequest> validator, CreateClienteCommandHandler handler, HttpContext http, CancellationToken ct) => { … })` que (a) invoca `validator.ValidateAsync(req)` → si falla, retorna `Results.ValidationProblem(errors)` con `statusCode: 400`; (b) invoca el handler dentro de un `try` — si captura `DuplicateNitException`, retorna `Results.Problem(title, detail, statusCode: 409, extensions: {"field": "nit"})`; (c) si éxito, retorna `Results.Created($"/api/v1/clientes/{dto.Id}", dto)`.

   Todas las respuestas usan Problem Details RFC 7807; el `ExceptionHandlingMiddleware` sigue siendo la red de seguridad para excepciones no controladas → 500 sin stack trace (NFR6). (Architecture — API & Communication Patterns + Error handling — test-design-epic-2 P0#3, P1#13)

8. **Given** el proyecto tiene suites de test verdes de las historias anteriores (1.1, 1.2, 1.3, 2.1, 2.2), **When** se ejecutan `pnpm --filter frontend build`, `pnpm --filter frontend lint`, `pnpm --filter frontend test`, `dotnet build`, `dotnet test`, **Then** todos completan con **cero errores TypeScript**, cero errores de lint, y **todos los tests unitarios/de componente/de integración pasan** — incluyendo los nuevos tests listados en las Tasks 5, 6, 12 y 13, y sin regresiones en los ~106 tests de frontend + ~49 tests de backend heredados de Story 2.2. (Company standards — test-design-epic-2 NFR6 compliance)

## Tasks / Subtasks

- [x] **Task 1 — Backend Domain: exception + `AddAsync` en `IClienteRepository`** (AC: #5, #7)
  - [ ] Crear `backend/src/SiesaAgents.Domain/Clientes/Exceptions/DuplicateNitException.cs`:
    ```csharp
    namespace SiesaAgents.Domain.Clientes.Exceptions;

    /// <summary>
    /// Thrown when an attempt to persist a Cliente violates the uk_clientes_nit
    /// unique constraint. It is a **known** outcome (mapped to 409 Problem Details
    /// by the endpoint), not a technical failure — no stack trace is exposed.
    /// </summary>
    public sealed class DuplicateNitException : Exception
    {
        public string Nit { get; }

        public DuplicateNitException(string nit)
            : base($"Ya existe un cliente con NIT/RUC '{nit}'.")
        {
            Nit = nit;
        }
    }
    ```
  - [ ] Editar `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — añadir:
    ```csharp
    /// <summary>
    /// Persists a new cliente. Callers must catch DbUpdateException whose
    /// inner PostgresException.SqlState == "23505" to map duplicate-NIT
    /// violations to a domain-level DuplicateNitException.
    /// </summary>
    Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default);
    ```
  - [ ] `dotnet build src/SiesaAgents.Domain` → 0 errores.

- [x] **Task 2 — Backend Infrastructure: `ClienteRepository.AddAsync`** (AC: #7)
  - [ ] Editar `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — añadir:
    ```csharp
    public async Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
    {
        // The repo is intentionally naive: it delegates to EF Core and lets
        // DbUpdateException bubble up. Mapping (23505 → DuplicateNitException) is
        // an application-layer decision made by the handler.
        _db.Clientes.Add(cliente);
        await _db.SaveChangesAsync(cancellationToken);
    }
    ```
  - [ ] Verificar que **no** hay `try/catch` en el repositorio — el handler es el único que traduce excepciones (Clean Architecture: infra reporta, application decide).
  - [ ] `dotnet build src/SiesaAgents.Infrastructure` → 0 errores.

- [x] **Task 3 — Backend Application: `CreateClienteRequest` + Validator (FluentValidation)** (AC: #3, #7)
  - [ ] Crear `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`:
    ```csharp
    namespace SiesaAgents.Application.Clientes.DTOs;

    /// <summary>
    /// Input payload for POST /api/v1/clientes. All fields are required and
    /// trimmed server-side. Duplicate NIT is enforced at DB level (uk_clientes_nit)
    /// and reported as 409 Problem Details.
    /// </summary>
    public sealed record CreateClienteRequest(
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad);
    ```
  - [ ] Crear `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`:
    ```csharp
    using FluentValidation;
    using SiesaAgents.Application.Clientes.DTOs;

    namespace SiesaAgents.Application.Clientes.Validators;

    public sealed class CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>
    {
        public CreateClienteRequestValidator()
        {
            RuleFor(x => x.Nombre)
                .NotEmpty().WithMessage("El nombre es requerido.")
                .MaximumLength(200).WithMessage("El nombre no puede exceder 200 caracteres.");

            RuleFor(x => x.Nit)
                .NotEmpty().WithMessage("El NIT/RUC es requerido.")
                .MaximumLength(50).WithMessage("El NIT/RUC no puede exceder 50 caracteres.");

            RuleFor(x => x.Telefono)
                .NotEmpty().WithMessage("El teléfono es requerido.")
                .MaximumLength(50).WithMessage("El teléfono no puede exceder 50 caracteres.");

            RuleFor(x => x.Ciudad)
                .NotEmpty().WithMessage("La ciudad es requerida.")
                .MaximumLength(100).WithMessage("La ciudad no puede exceder 100 caracteres.");
        }
    }
    ```
    (`.NotEmpty()` en FluentValidation cubre `null`, `""`, y whitespace-only — comportamiento equivalente a `string.IsNullOrWhiteSpace`.)
  - [ ] `dotnet build src/SiesaAgents.Application` → 0 errores.

- [x] **Task 4 — Backend Application: `CreateClienteCommand` + Handler** (AC: #4, #5, #7)
  - [ ] Crear `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`:
    ```csharp
    namespace SiesaAgents.Application.Clientes.Commands;

    public sealed record CreateClienteCommand(
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad);
    ```
  - [ ] Crear `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`:
    ```csharp
    using Microsoft.EntityFrameworkCore;
    using Npgsql;
    using SiesaAgents.Application.Clientes.DTOs;
    using SiesaAgents.Domain.Clientes.Entities;
    using SiesaAgents.Domain.Clientes.Exceptions;
    using SiesaAgents.Domain.Clientes.Interfaces;

    namespace SiesaAgents.Application.Clientes.Commands;

    /// <summary>
    /// Executes the "create cliente" use case:
    ///   1. Builds a domain entity via ClienteEntity.Create (which trims + enforces
    ///      NotEmpty invariants — defence-in-depth against a validator gap).
    ///   2. Persists via IClienteRepository.AddAsync.
    ///   3. Translates PostgreSQL 23505 (unique_violation on uk_clientes_nit) into
    ///      a domain-level DuplicateNitException. Any other DbUpdateException
    ///      bubbles up to ExceptionHandlingMiddleware (500 Problem Details).
    /// </summary>
    public sealed class CreateClienteCommandHandler
    {
        private readonly IClienteRepository _repository;

        public CreateClienteCommandHandler(IClienteRepository repository)
        {
            _repository = repository;
        }

        public async Task<ClienteDto> HandleAsync(
            CreateClienteCommand command,
            CancellationToken cancellationToken = default)
        {
            var entity = ClienteEntity.Create(
                command.Nombre,
                command.Nit,
                command.Telefono,
                command.Ciudad);

            try
            {
                await _repository.AddAsync(entity, cancellationToken);
            }
            catch (DbUpdateException ex) when (IsUniqueNitViolation(ex))
            {
                throw new DuplicateNitException(entity.Nit);
            }

            return new ClienteDto(
                entity.Id,
                entity.Nombre,
                entity.Nit,
                entity.Telefono,
                entity.Ciudad,
                entity.CreatedAt,
                entity.UpdatedAt);
        }

        private static bool IsUniqueNitViolation(DbUpdateException ex)
        {
            // Npgsql surfaces PostgreSQL's SQLSTATE via PostgresException.SqlState.
            // 23505 = unique_violation. We also check the constraint name so we
            // don't mis-report unrelated unique violations (defense-in-depth for
            // future indexes on the clientes table).
            return ex.InnerException is PostgresException pg
                   && pg.SqlState == "23505"
                   && (pg.ConstraintName is null
                       || pg.ConstraintName.Equals("uk_clientes_nit", StringComparison.OrdinalIgnoreCase));
        }
    }
    ```
  - [ ] Añadir `using Npgsql;` — el paquete ya está referenciado transitivamente por `Npgsql.EntityFrameworkCore.PostgreSQL` en `SiesaAgents.Infrastructure`, pero **la referencia debe estar en `SiesaAgents.Application.csproj`** para importar `PostgresException`. Editar `backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj` para añadir:
    ```xml
    <PackageReference Include="Npgsql" Version="10.0.3" />
    ```
    (versión sincronizada con la que Infrastructure ya resuelve — mantener aligned).
  - [ ] `dotnet build src/SiesaAgents.Application` → 0 errores.

- [x] **Task 5 — Backend Tests: Unit (handler + validator)** (AC: #3, #5, #7, #8)
  - [ ] `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteRequestValidatorTests.cs`:
    - `Validate_AllFieldsValid_Succeeds()` — valida con inputs mínimos válidos.
    - `Validate_EmptyField_FailsWithExpectedMessage(string field)` — casos: Nombre="", Nit="", Telefono="", Ciudad="" (test parametrizado o 4 métodos) → `ValidationFailure.ErrorMessage` matches `"El nombre es requerido."`, etc.
    - `Validate_WhitespaceOnlyField_Fails(string field)` — casos: Nombre="   ", Nit=" \t ", etc. → `.NotEmpty()` de FluentValidation rechaza whitespace.
    - `Validate_FieldExceedsMaxLength_Fails(string field, int max)` — Nombre 201 chars → falla; Nit 51 chars → falla; Telefono 51 → falla; Ciudad 101 → falla.
  - [ ] `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`:
    - `HandleAsync_ValidCommand_ReturnsDtoAndPersists()` — mock `IClienteRepository.AddAsync` (via test double); asserta `AddAsync` fue invocado 1 vez con una `ClienteEntity` cuyos campos coinciden con el command (post-trim); asserta el DTO retornado tiene `Id != Guid.Empty`, `Nombre` correcto, `CreatedAt` cercano a `UtcNow`.
    - `HandleAsync_RepositoryThrowsUniqueViolation_ThrowsDuplicateNit()` — mock `AddAsync` lanzando `new DbUpdateException("...", new PostgresException("...", "23505", "23505", "uk_clientes_nit"))`; asserta que el handler lanza `DuplicateNitException` cuya propiedad `Nit` coincide con el input.
    - `HandleAsync_RepositoryThrowsOtherDbUpdate_Propagates()` — mock `AddAsync` lanzando `new DbUpdateException("...", new PostgresException("...", "23000", "23000", "some_other_constraint"))`; asserta que el handler **NO** captura — la excepción se propaga (será convertida a 500 por el middleware).
    - `HandleAsync_PassesCancellationToken()` — verifica que el token del command llega intacto al repo.
    - **Nota sobre PostgresException**: es una `sealed class`; para mockearla en xUnit sin BD real, construir instancias directamente vía sus ctors públicos (Npgsql 10 expone `PostgresException(string, string sqlState, string severity, ...)`). Alternativa: usar reflection en un helper `TestPostgresException.WithState(string sqlState, string? constraint = null)`.
  - [ ] Actualizar `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` y `GetClienteByIdQueryHandlerTests.cs` — si la fake `IClienteRepository` no implementa el nuevo `AddAsync`, añadir stub que lance `NotImplementedException` para preservar la interfaz. (Story 2.2 heredó el mismo patrón cuando añadió `GetByIdAsync`.)
  - [ ] `dotnet test tests/SiesaAgents.UnitTests` → todos verdes.

- [x] **Task 6 — Backend API: endpoint `POST /api/v1/clientes` + DI wiring** (AC: #4, #5, #6, #7)
  - [ ] Editar `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — añadir dentro del `group.MapGroup("/api/v1/clientes")` (después del `MapGet("/{id:guid}", ...)` de Story 2.2):
    ```csharp
    group.MapPost("/", async (
        CreateClienteRequest request,
        IValidator<CreateClienteRequest> validator,
        CreateClienteCommandHandler handler,
        HttpContext http,
        CancellationToken ct) =>
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            var errors = validation.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => System.Text.Json.JsonNamingPolicy.CamelCase.ConvertName(g.Key),
                    g => g.Select(e => e.ErrorMessage).ToArray());

            return Results.ValidationProblem(
                errors,
                title: "Uno o más campos son inválidos.",
                statusCode: StatusCodes.Status400BadRequest,
                type: "https://tools.ietf.org/html/rfc9110#section-15.5.1",
                instance: http.Request.Path);
        }

        try
        {
            var command = new CreateClienteCommand(
                request.Nombre,
                request.Nit,
                request.Telefono,
                request.Ciudad);

            var dto = await handler.HandleAsync(command, ct);

            // 201 Created + Location header — aligns with architecture doc:
            // "POST → 201 Created + created object".
            return Results.Created($"/api/v1/clientes/{dto.Id}", dto);
        }
        catch (DuplicateNitException ex)
        {
            return Results.Problem(
                title: "NIT/RUC duplicado",
                detail: "Ya existe un cliente con el NIT/RUC indicado.",
                statusCode: StatusCodes.Status409Conflict,
                type: "https://tools.ietf.org/html/rfc9110#section-15.5.10",
                instance: http.Request.Path,
                extensions: new Dictionary<string, object?> { ["field"] = "nit" });
        }
    })
    .WithName("CreateCliente");
    ```
  - [ ] Añadir `using FluentValidation;` y `using SiesaAgents.Application.Clientes.Commands;` + `using SiesaAgents.Application.Clientes.DTOs;` + `using SiesaAgents.Domain.Clientes.Exceptions;` al header del archivo.
  - [ ] Editar `backend/src/SiesaAgents.API/Program.cs` — registrar en DI (junto a los otros `AddScoped` de Story 2.1/2.2, antes de `builder.Build()`):
    ```csharp
    // Story 2.3 — create-client wiring.
    builder.Services.AddScoped<CreateClienteCommandHandler>();
    builder.Services.AddScoped<IValidator<CreateClienteRequest>, CreateClienteRequestValidator>();
    ```
  - [ ] Añadir los `using` correspondientes en `Program.cs`: `using FluentValidation;`, `using SiesaAgents.Application.Clientes.Commands;`, `using SiesaAgents.Application.Clientes.DTOs;`, `using SiesaAgents.Application.Clientes.Validators;`.
  - [ ] Verificar contra Scalar (`http://localhost:5000/scalar`) que el endpoint `CreateCliente` aparece con 3 respuestas documentadas (201/400/409).
  - [ ] `dotnet build src/SiesaAgents.API` → 0 errores; **NO** debe aparecer el warning "unused using" — todos los using deben resolverse.

- [x] **Task 7 — Backend Integration Tests: `POST /api/v1/clientes`** (AC: #4, #5, #6, #7, #8)
  - [ ] Extender `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` con los siguientes casos (usan la `WebApplicationFactory<Program>` + EF Core InMemory heredada de Story 2.1 — recordar que Testcontainers-PostgreSQL no está disponible en el sandbox, así que los tests de 409 dependen del **InMemory provider** que emula `unique index` via `.HasIndex(...).IsUnique()`: **verificar** en un smoke local que EF Core InMemory 10 respeta la unicidad — si NO lo hace, el test 409 debe marcarse `[Trait("Category","Integration")]` y correrse sólo cuando el sandbox tiene Postgres real):
    - `CreateCliente_ValidPayload_Returns201WithDtoAndLocation()`:
      - POST `{ "nombre": "Nuevo Cliente", "nit": "999888777-1", "telefono": "+57 300 555 0000", "ciudad": "Cali" }`.
      - Asserta `StatusCode == 201`, header `Location` = `/api/v1/clientes/{id}`, body JSON camelCase con los 4 campos + `id` (GUID) + `createdAt`/`updatedAt` (ISO 8601 con offset).
      - Segunda petición GET al `Location` → 200 con el mismo DTO (round-trip verified).
    - `CreateCliente_EmptyNombre_Returns400ProblemDetails()`:
      - POST `{ "nombre": "", "nit": "…", "telefono": "…", "ciudad": "…" }`.
      - Asserta 400, `Content-Type: application/problem+json`, body contiene `"errors": { "nombre": ["El nombre es requerido."] }`.
      - **NO** contiene stack traces (`System.`, `Microsoft.EntityFrameworkCore`, `.cs:line`).
    - `CreateCliente_WhitespaceOnlyFields_Returns400WithAllFieldErrors()` — todos los 4 campos con espacios → asserta 4 keys en `errors`.
    - `CreateCliente_NitExceedsMaxLength_Returns400()` — NIT de 51 chars → falla con mensaje MaxLength.
    - `CreateCliente_DuplicateNit_Returns409ProblemDetails()`:
      - Seed 1 cliente con `nit = "900123456-7"`.
      - POST otro cliente con el mismo `nit`.
      - Asserta 409, body contiene `"title":"NIT/RUC duplicado"`, `"status":409`, `"detail":"Ya existe un cliente con el NIT/RUC indicado."`, `"field":"nit"` en `extensions` (o top-level según la serialización de `Results.Problem` con `extensions:` — verificar experimentalmente).
      - Asserta que **NO** contiene `.cs:line`, `System.`, `Microsoft.EntityFrameworkCore`, `Npgsql` (NFR6).
    - `CreateCliente_DuplicateNit_DoesNotCreateDuplicateRow()` — post-condition assertion: `dbContext.Clientes.Count(c => c.Nit == "900123456-7") == 1` después del 409.
    - `CreateCliente_TrimsFieldsBeforePersist()` — POST `{ "nombre": "  Acme  ", "nit": "  900-1  ", ... }` → GET del recién creado retorna `"nombre": "Acme"`, `"nit": "900-1"` (defensa server-side por `ClienteEntity.Create`).
  - [ ] Ejecutar `dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ClienteEndpointsTests` → todos verdes.

- [x] **Task 8 — Frontend Toast Provider wiring** (AC: #4, #6)
  - [ ] Editar `frontend/src/main.tsx` para envolver el `RouterProvider` con `ToastProvider` de siesa-ui-kit:
    ```tsx
    import { ToastProvider } from 'siesa-ui-kit'
    // ...
    createRoot(rootElement).render(
      <StrictMode>
        <QueryProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </QueryProvider>
      </StrictMode>,
    )
    ```
  - [ ] `ToastProvider` **debe** envolver `RouterProvider` para que cualquier ruta pueda invocar `toast.success(...)` / `toast.error(...)` (la función `toast` de siesa-ui-kit despacha eventos que sólo se muestran si el provider está montado).
  - [ ] En `frontend/src/test/setup.ts` **no** es necesario montar `ToastProvider` globalmente — los tests que asertan sobre toasts renderizarán el provider localmente (ver Task 12).

- [x] **Task 9 — Frontend Application: `clienteSchema` (Zod)** (AC: #3)
  - [ ] Crear `frontend/src/modules/crm/clientes/application/clienteSchema.ts`:
    ```ts
    import { z } from 'zod'

    /**
     * Zod schema for the create/edit cliente form. `.trim()` runs BEFORE
     * `.min(1)` so a whitespace-only value fails the "required" check and
     * emits the exact copy required by AC#3 (matches UX spec validation).
     * MaxLength values mirror the backend column limits (200/50/50/100) to
     * avoid frontend/backend drift.
     */
    export const clienteFormSchema = z.object({
      nombre: z
        .string()
        .trim()
        .min(1, 'El nombre es requerido')
        .max(200, 'El nombre no puede exceder 200 caracteres'),
      nit: z
        .string()
        .trim()
        .min(1, 'El NIT/RUC es requerido')
        .max(50, 'El NIT/RUC no puede exceder 50 caracteres'),
      telefono: z
        .string()
        .trim()
        .min(1, 'El teléfono es requerido')
        .max(50, 'El teléfono no puede exceder 50 caracteres'),
      ciudad: z
        .string()
        .trim()
        .min(1, 'La ciudad es requerida')
        .max(100, 'La ciudad no puede exceder 100 caracteres'),
    })

    export type ClienteFormValues = z.infer<typeof clienteFormSchema>
    ```
  - [ ] Crear `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts`:
    - Happy path: valores válidos → `parse` retorna objeto con strings trim-eados.
    - Cada campo vacío / whitespace-only → error con mensaje exacto (`"El nombre es requerido"` etc.).
    - Cada campo excediendo max → error con mensaje de MaxLength.
    - `z.string()` sin `.trim()` **no** cubriría el caso "solo espacios" — verificar que el orden `.trim().min(1)` es correcto.

- [x] **Task 10 — Frontend Domain + Infrastructure: `create` en el repositorio** (AC: #4, #5, #7)
  - [ ] Editar `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — extender:
    ```ts
    import type { Cliente } from './Cliente'
    import type { ClienteFormValues } from '../application/clienteSchema'

    /**
     * Payload accepted by POST /api/v1/clientes. Same shape as ClienteFormValues,
     * kept as its own type so the repository contract does not leak Zod details.
     */
    export type CreateClientePayload = {
      readonly nombre: string
      readonly nit: string
      readonly telefono: string
      readonly ciudad: string
    }

    export interface IClienteRepository {
      getAll(signal?: AbortSignal): Promise<Cliente[]>
      getById(id: string, signal?: AbortSignal): Promise<Cliente>
      /**
       * POST /api/v1/clientes → 201 Created returning the freshly persisted
       * Cliente. Rejects with an AxiosError when the server responds 4xx/5xx
       * (React Query surfaces the error; callers inspect `error.response?.status`
       * — 409 signals a duplicate NIT).
       */
      create(payload: CreateClientePayload, signal?: AbortSignal): Promise<Cliente>
    }
    ```
    (Importar `ClienteFormValues` sólo si `CreateClientePayload` es un alias — no hace falta si son idénticos. Mantener el tipo dedicado desacopla el contrato del repositorio del schema Zod.)
  - [ ] Editar `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implementar `create`:
    ```ts
    async create(payload, signal) {
      const { data } = await apiClient.post<Cliente>('/api/v1/clientes', payload, { signal })
      return data
    },
    ```
  - [ ] Añadir tests en `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.create.test.ts` (patrón heredado de `clienteApiRepository.getById.test.ts`):
    - happy path: mock MSW POST → 201 con DTO → `create` retorna el DTO.
    - 400: MSW → AxiosError con `response.status === 400`.
    - 409: MSW → AxiosError con `response.status === 409` y body `{ title: "NIT/RUC duplicado", extensions: { field: "nit" } }`.
    - 500: MSW → AxiosError con `response.status === 500`.

- [x] **Task 11 — Frontend Application: `useCreateCliente` (TanStack Query mutation)** (AC: #4, #5, #6, #7)
  - [ ] Crear `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`:
    ```ts
    import { useMutation, useQueryClient } from '@tanstack/react-query'
    import type { AxiosError } from 'axios'
    import { toast } from 'siesa-ui-kit'
    import type { Cliente } from '../domain/Cliente'
    import type { CreateClientePayload } from '../domain/IClienteRepository'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

    /**
     * Shape of the Problem Details body the backend emits for 409 conflicts.
     * Only the fields the frontend actually reads are typed — the server may
     * add more keys (`type`, `instance`, ...) that we ignore.
     */
    interface DuplicateNitProblem {
      readonly title?: string
      readonly field?: string
      // 'extensions' is the RFC 7807 open-ended bag; ASP.NET flattens it into
      // the root object when using Results.Problem(extensions: ...), so we read
      // both shapes defensively.
      readonly extensions?: { readonly field?: string }
    }

    export type CreateClienteError = AxiosError<DuplicateNitProblem>

    /**
     * Mutation for POST /api/v1/clientes.
     *
     * Success:
     *   1. Insert the new Cliente at the head of the ['clientes'] cache (optimistic
     *      append after server confirms — avoids the flash of a full refetch).
     *   2. Invalidate ['clientes'] so any stale consumers reconcile with the server.
     *   3. Toast success (Spanish, green, bottom-right, 3s).
     *
     * Error:
     *   • 409 → the caller (form component) handles it inline on the NIT field.
     *     No toast (business validation, not a network error — UX spec rule).
     *   • Anything else → toast red "No se pudo guardar. Intenta de nuevo." (5s).
     */
    export function useCreateCliente() {
      const queryClient = useQueryClient()

      return useMutation<Cliente, CreateClienteError, CreateClientePayload>({
        mutationFn: (payload) => clienteApiRepository.create(payload),
        onSuccess: (created) => {
          queryClient.setQueryData<Cliente[]>(['clientes'], (prev) =>
            prev ? [created, ...prev] : [created],
          )
          queryClient.invalidateQueries({ queryKey: ['clientes'] })
          toast.success('Cliente creado correctamente', {
            position: 'bottom-right',
            duration: 3000,
            color: 'green',
          })
        },
        onError: (error) => {
          // 409 is surfaced to the form so it can render an inline field error.
          // 400 is defensive (FluentValidation covers what Zod already blocks);
          // handled as a network-style error only if it slips through.
          if (error.response?.status === 409) {
            return
          }
          toast.error('No se pudo guardar. Intenta de nuevo.', {
            position: 'bottom-right',
            duration: 5000,
            color: 'red',
          })
        },
      })
    }
    ```
  - [ ] Crear tests unitarios `frontend/src/modules/crm/clientes/application/useCreateCliente.test.tsx`:
    - `renderHook` con `QueryClientProvider` wrapper + `ToastProvider`.
    - **Happy path (201)**: MSW `HttpResponse.json(dto, { status: 201 })` → `mutate({...})` → `waitFor(() => result.current.isSuccess)` → asserta (a) `data` es el DTO, (b) `queryClient.getQueryData(['clientes'])` contiene el nuevo cliente al índice 0, (c) `toast.success` fue invocado (mockeando `toast` con `vi.mock('siesa-ui-kit', ...)` o inspeccionando el DOM del provider).
    - **409 path**: MSW retorna `{ title: 'NIT/RUC duplicado', status: 409, extensions: { field: 'nit' } }, { status: 409 }` → asserta `result.current.isError && result.current.error.response?.status === 409` **y** que **NO** se disparó `toast.error` (spy con 0 llamadas).
    - **500 path**: MSW `{ status: 500 }` → asserta `isError` + `toast.error` invocado 1 vez con `"No se pudo guardar. Intenta de nuevo."`.
    - **Cache invalidation**: spy sobre `queryClient.invalidateQueries` — invocado con `{ queryKey: ['clientes'] }` en el path exitoso (mitiga R-004, P0#7 en test-design).

- [x] **Task 12 — Frontend Presentation: `ClienteFormModal` (React Hook Form + Zod + AlertDialog)** (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Crear `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.tsx`:
    ```tsx
    import { useEffect } from 'react'
    import { useForm } from 'react-hook-form'
    import { zodResolver } from '@hookform/resolvers/zod'
    import { AlertDialog, Button, Input } from 'siesa-ui-kit'
    import {
      clienteFormSchema,
      type ClienteFormValues,
    } from '../application/clienteSchema'
    import { useCreateCliente } from '../application/useCreateCliente'

    export interface ClienteFormModalProps {
      /** Whether the modal is visible. */
      isOpen: boolean
      /** Called when the user cancels, presses Esc, or the mutation completes ok. */
      onClose: () => void
    }

    /**
     * Modal wrapper around the create-cliente form. All copy is in Spanish; all
     * identifiers are in English. Uses siesa-ui-kit AlertDialog as the a11y-safe
     * dialog container (Radix-backed, focus-trap, Esc-to-close).
     *
     * The form is controlled by React Hook Form with a Zod resolver so validation
     * runs `onBlur` (per UX spec Feedback Patterns) and on submit; whitespace-only
     * values fail the `.trim().min(1)` rules and render an inline error.
     */
    export function ClienteFormModal({ isOpen, onClose }: ClienteFormModalProps) {
      const {
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitting },
        reset,
        setError,
        setFocus,
      } = useForm<ClienteFormValues>({
        resolver: zodResolver(clienteFormSchema),
        mode: 'onBlur',
        defaultValues: { nombre: '', nit: '', telefono: '', ciudad: '' },
      })

      const createMutation = useCreateCliente()

      // Auto-focus Nombre when the modal opens so keyboard users can type right away.
      useEffect(() => {
        if (isOpen) {
          setFocus('nombre')
        } else {
          // Reset form + any mutation state when the modal closes so the next open
          // starts clean.
          reset()
          createMutation.reset()
        }
      }, [isOpen, setFocus, reset, createMutation])

      const onSubmit = handleSubmit(async (values) => {
        try {
          await createMutation.mutateAsync(values)
          onClose()
        } catch (error) {
          // 409 → inline NIT error. Any other error was already handled by the
          // mutation hook (toast). We do not close the modal so the user can retry.
          if (
            typeof error === 'object' &&
            error !== null &&
            'response' in error &&
            (error as { response?: { status?: number } }).response?.status === 409
          ) {
            setError('nit', {
              type: 'server',
              message: 'El NIT/RUC ya está registrado',
            })
            setFocus('nit')
          }
        }
      })

      return (
        <AlertDialog
          isOpen={isOpen}
          title="Nuevo cliente"
          showCloseButton
          hideCancel
          size="max-w-md"
          onCancel={onClose}
          data-testid="cliente-form-modal"
          actions={
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="cliente-form-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="cliente-form"
                variant="default"
                disabled={isSubmitting || !isValid}
                data-testid="cliente-form-submit"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          }
        >
          <form
            id="cliente-form"
            onSubmit={onSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <Field
              id="nombre"
              label="Nombre"
              required
              error={errors.nombre?.message}
              testId="cliente-form-nombre"
              {...register('nombre')}
            />
            <Field
              id="nit"
              label="NIT/RUC"
              required
              error={errors.nit?.message}
              testId="cliente-form-nit"
              {...register('nit')}
            />
            <Field
              id="telefono"
              label="Teléfono"
              required
              error={errors.telefono?.message}
              testId="cliente-form-telefono"
              {...register('telefono')}
            />
            <Field
              id="ciudad"
              label="Ciudad"
              required
              error={errors.ciudad?.message}
              testId="cliente-form-ciudad"
              {...register('ciudad')}
            />
            <p className="text-xs text-slate-500">* Campos obligatorios</p>
          </form>
        </AlertDialog>
      )
    }

    /**
     * Small inline `Field` composition that wraps siesa-ui-kit `Input` with a
     * label + inline error. Kept local because the shape is specific to this
     * modal — if a second form needs it, promote it to `shared/components/`.
     */
    interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
      id: string
      label: string
      required?: boolean
      error?: string
      testId: string
    }

    const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field(
      { id, label, required, error, testId, ...inputProps },
      ref,
    ) {
      const errorId = `${id}-error`
      return (
        <div className="flex flex-col gap-1">
          <label htmlFor={id} className="text-sm font-medium text-slate-900">
            {label}
            {required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
          </label>
          <Input
            id={id}
            ref={ref}
            type="text"
            aria-required={required || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            data-testid={testId}
            {...inputProps}
          />
          {error && (
            <p
              id={errorId}
              role="alert"
              className="text-sm text-red-600"
              data-testid={`${testId}-error`}
            >
              {error}
            </p>
          )}
        </div>
      )
    })
    ```
    (Añadir `import React from 'react'` en el header si `forwardRef` no está tipado. Alternativa: usar función simple sin `forwardRef` — RHF `register(...)` no requiere forward ref si el `Input` de siesa-ui-kit acepta `ref` nativamente.)
  - [ ] **Verificar contract del `Input` de siesa-ui-kit**: si no acepta `ref` (algunos wrappers no), simplificar `Field` a un componente funcional sin `forwardRef`, colocando el `ref` en un input HTML nativo — pero **preferir siesa-ui-kit `Input`** porque cumple el mandate del kit. Si el `Input` no expone `ref`, usar `useController` de React Hook Form en su lugar:
    ```tsx
    const { field: nombreField, fieldState: nombreState } = useController({ name: 'nombre', control })
    <Input value={nombreField.value} onChange={nombreField.onChange} onBlur={nombreField.onBlur} .../>
    ```
    Ajustar la implementación según lo que el `Input` real soporte (verificar en Story 2.1 `ClienteListView.tsx` — el `Input` ahí es un uncontrolled con `onChange`, sugiriendo que `useController` es el path seguro).
  - [ ] Crear `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.test.tsx` cubriendo:
    - `renders form with 4 required fields + labels + submit disabled initially` — asserta cada `data-testid`, cada label visible con `*`, botón "Guardar" está `disabled` cuando el formulario aún no es válido (RHF `mode: 'onBlur'` + defaultValues vacíos + `isValid=false` inicialmente — o `mode: 'onSubmit'` como alternativa si RHF no reporta `isValid=false` en modo `onBlur` con inputs vacíos; en ese caso simplemente removemos la parte `!isValid` del `disabled`).
    - `submits with valid data → invokes mutation` — llenar los 4 campos, click "Guardar", asserta `useCreateCliente.mutateAsync` invocado con el payload trim-eado; MSW responde 201 → modal se cierra (`onClose` invocado); toast success.
    - `shows inline error on empty field submit` — click en "Guardar" con campos vacíos → asserta que **NO** hay fetch a POST (MSW request counter = 0) y que aparecen los 4 mensajes: `"El nombre es requerido"`, `"El NIT/RUC es requerido"`, `"El teléfono es requerido"`, `"La ciudad es requerida"`.
    - `shows inline error on whitespace-only field` — llenar Nombre con `"   "`, blur → asserta mensaje `"El nombre es requerido"`.
    - `on 409 duplicate NIT → inline NIT error, modal stays open, no toast` — MSW responde `{ title: 'NIT/RUC duplicado', extensions: { field: 'nit' } }` con status 409 → asserta:
      * `data-testid="cliente-form-nit-error"` contiene `"El NIT/RUC ya está registrado"` (texto **exacto**, ni `title` ni `detail` del Problem Details);
      * el modal sigue montado (`cliente-form-modal` presente);
      * el campo `nit` conserva su valor;
      * `toast.error` NO fue invocado (spy con 0 llamadas);
      * asserta que **ningún** elemento del DOM contiene el string `"Ya existe un cliente"` (NFR6 — no leak del detail).
    - `on 500 → toast error, modal stays open` — MSW responde 500 → toast rojo visible; modal sigue montado.
    - `on cancel → closes modal without submit` — click "Cancelar" → asserta `onClose` invocado; MSW POST counter = 0.
    - `auto-focus on Nombre when opening` — asserta que después de render con `isOpen=true`, `document.activeElement` es el `Input` de `nombre` (o el `input` interno del kit).
    - **Test de NFR6 (defense-in-depth)**: MSW responde 409 con `detail: "SELECT * FROM users; DROP TABLE...`" (payload maliciosamente exagerado) → asserta que el string **no** aparece en el DOM.
  - [ ] Exportar `ClienteFormModal` desde el barrel `frontend/src/modules/crm/clientes/index.ts`:
    ```ts
    export { ClienteFormModal } from './presentation/ClienteFormModal'
    export { useCreateCliente } from './application/useCreateCliente'
    ```

- [x] **Task 13 — Frontend Presentation: cablear "Nuevo cliente" en `ClienteListView`** (AC: #1)
  - [ ] Editar `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    - Añadir estado local: `const [isFormOpen, setIsFormOpen] = useState(false)`.
    - Añadir `Button` primario `"Nuevo cliente"` en el header del panel (a la derecha del `<h1>Clientes</h1>` — usar `flex justify-between items-center`):
      ```tsx
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h1 id="clientes-title" className="text-lg font-bold text-slate-900">
          Clientes
        </h1>
        <Button
          type="button"
          variant="default"
          onClick={() => setIsFormOpen(true)}
          data-testid="cliente-nuevo-button"
          aria-label="Nuevo cliente"
        >
          Nuevo cliente
        </Button>
      </div>
      ```
    - Reemplazar el `onClick` del CTA `"Nuevo cliente"` en el `EmptyState` variant `no-clients`:
      ```tsx
      cta={{
        label: 'Nuevo cliente',
        onClick: () => setIsFormOpen(true),
      }}
      ```
      (Elimina el `console.info('TODO: Story 2.3 — Create Client')` — nota que Story 2.1 lo dejó como stub explícito para esta historia.)
    - Renderizar el modal fuera del `<aside>` (al mismo nivel que el `<aside>` root — para que no se recorte por el `overflow` del panel):
      ```tsx
      return (
        <>
          <aside …>…</aside>
          <ClienteFormModal
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
          />
        </>
      )
      ```
      (Cambiar el return statement al fragment `<>...</>`.)
  - [ ] Actualizar `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`:
    - Añadir test: `[TC-Story-2.3-Header-Nuevo-Cliente-Button]` — asserta que el botón `data-testid="cliente-nuevo-button"` está siempre visible (loading, error, empty, con datos).
    - Añadir test: `[TC-Story-2.3-Header-Opens-Modal]` — click en `cliente-nuevo-button` → asserta que `data-testid="cliente-form-modal"` aparece en el DOM.
    - Añadir test: `[TC-Story-2.3-Empty-CTA-Opens-Modal]` — MSW retorna `[]` → aparece `EmptyState` con CTA `"Nuevo cliente"` → click → modal visible.
    - Los tests heredados de Stories 2.1 y 2.2 (skeleton, error panel, filter, selection, mobile hide) **deben seguir verdes**. Verificar que el `<>` fragment no rompe los queries por `role="complementary"` (aside implícito).

- [x] **Task 14 — Frontend MSW: handler POST `/api/v1/clientes`** (AC: #4, #5, #6, #8)
  - [ ] Editar `frontend/src/test/msw/handlers.ts` — añadir el POST handler con state mutable (nueva variable `let currentClientes = [...seedClientes]` para tests que verifican inserción):
    ```ts
    import { http, HttpResponse } from 'msw'
    import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

    export const seedClientes: Cliente[] = [ /* … existente … */ ]

    // Mutable seed so tests exercising create/edit/delete can observe list changes.
    // resetClienteState() must be invoked in each test's afterEach if the test mutates.
    let currentClientes: Cliente[] = [...seedClientes]

    export function resetClienteState() {
      currentClientes = [...seedClientes]
    }

    export const handlers = [
      http.get('*/api/v1/clientes', () => HttpResponse.json(currentClientes)),
      http.get('*/api/v1/clientes/:id', ({ params }) => { /* existente */ }),
      http.post('*/api/v1/clientes', async ({ request }) => {
        const body = (await request.json()) as {
          nombre?: string; nit?: string; telefono?: string; ciudad?: string
        }
        // Duplicate NIT fast-path: matches uk_clientes_nit semantics.
        if (body.nit && currentClientes.some((c) => c.nit === body.nit)) {
          return HttpResponse.json(
            {
              type: 'https://tools.ietf.org/html/rfc9110#section-15.5.10',
              title: 'NIT/RUC duplicado',
              status: 409,
              detail: 'Ya existe un cliente con el NIT/RUC indicado.',
              instance: '/api/v1/clientes',
              field: 'nit',
            },
            { status: 409 },
          )
        }
        const now = new Date().toISOString()
        const created: Cliente = {
          id: crypto.randomUUID(),
          nombre: (body.nombre ?? '').trim(),
          nit: (body.nit ?? '').trim(),
          telefono: (body.telefono ?? '').trim(),
          ciudad: (body.ciudad ?? '').trim(),
          createdAt: now,
          updatedAt: now,
        }
        currentClientes = [created, ...currentClientes]
        return HttpResponse.json(created, {
          status: 201,
          headers: { Location: `/api/v1/clientes/${created.id}` },
        })
      }),
    ]
    ```
  - [ ] Añadir en `frontend/src/test/setup.ts` un `afterEach(() => { resetClienteState(); server.resetHandlers() })` para que los tests que mutan la lista no se contaminen entre sí. **Verificar** que el setup actual (Story 2.1) ya reset-ea handlers — sólo hay que añadir la llamada a `resetClienteState()`.

- [x] **Task 15 — Frontend integration test: end-to-end de creación** (AC: #4, #5)
  - [ ] Crear `frontend/src/routes/clientes.create.integration.test.tsx` (patrón heredado de `clientes.detail.integration.test.tsx`):
    - Monta el árbol de rutas con `createMemoryHistory({ initialEntries: ['/clientes'] })` + `createRouter` + `<RouterProvider />` + `<QueryProvider>` + `<ToastProvider>`.
    - Test 1 (happy path): renderiza, click `cliente-nuevo-button`, llena los 4 campos, click "Guardar" → asserta:
      * el modal se cierra;
      * el toast `"Cliente creado correctamente"` aparece en el DOM;
      * el nuevo cliente aparece **al inicio** de la lista `data-testid="clientes-list"`.
    - Test 2 (409 flow): renderiza, abre modal, llena el `NIT` con `"900123456-7"` (que ya existe en seed) → asserta:
      * el modal sigue montado;
      * `data-testid="cliente-form-nit-error"` contiene el string exacto `"El NIT/RUC ya está registrado"`;
      * el string `"Ya existe un cliente"` **NO** aparece en el DOM (NFR6);
      * la lista **NO** cambió (mismo count que antes del intento).

- [x] **Task 16 — Verificación end-to-end** (AC: #8)
  - [ ] `pnpm --filter frontend build` → 0 errores TypeScript (`tsc -b` limpio); `routeTree.gen.ts` incluye `/clientes` sin nueva ruta (Story 2.3 no añade rutas — sólo un modal).
  - [ ] `pnpm --filter frontend lint` → 0 errores.
  - [ ] `pnpm --filter frontend test` → todos los tests verdes (heredados + los ~15 nuevos de esta historia).
  - [ ] `dotnet build backend/SiesaAgents.sln` → 0 errores.
  - [ ] `dotnet test backend/SiesaAgents.sln` → todos los tests verdes.
  - [ ] Manual sanity (si hay backend + Postgres disponibles):
    - Visitar `http://localhost:5173/clientes` → click "Nuevo cliente" → modal abierto.
    - Llenar los 4 campos → click "Guardar" → modal cierra, toast verde, cliente aparece en lista.
    - Repetir el NIT/RUC del cliente recién creado → modal permanece con mensaje inline "El NIT/RUC ya está registrado" bajo el campo NIT.
    - Enviar formulario con campos vacíos → mensajes inline aparecen; **cero** requests POST en Network DevTools.
    - Detener backend → intentar crear → toast rojo "No se pudo guardar. Intenta de nuevo.", modal sigue abierto con los valores intactos.
    - Verificar en Scalar (`/scalar`) que `CreateCliente` documenta 201/400/409.

## Dev Notes

### Story 2.1 & 2.2 handoff (relevante para esta historia)

- **`ClienteListView.tsx` ya está montado** con el layout 280px + `EmptyState` variant `no-clients` cuyo CTA `"Nuevo cliente"` actualmente hace `console.info('TODO: Story 2.3 — Create Client')` — Task 13 reemplaza el stub con `setIsFormOpen(true)`.
- **`useClientes()`** ya usa `queryKey: ['clientes']` con `staleTime: 30_000` — la mutación de esta historia invalida esa key para respetar FR27 (R-004 mitigation).
- **`ClienteEntity.Create(...)`** (Story 2.1) ya realiza `.Trim()` + `NotEmpty` en los 4 campos. FluentValidation en Task 3 duplica esa validación en la capa de aplicación como fail-fast (permite retornar 400 sin cargar EF Core), pero `ClienteEntity.Create` sigue siendo el guardián final de dominio.
- **Índice único `uk_clientes_nit`** ya está creado por la migración `20260702091701_AddClientesTable` (Story 2.1) — Task 7 depende de esto para el escenario 409.
- **`apiClient` (Axios singleton)** ya está wired con `baseURL` desde `VITE_API_URL` y con interceptors — usar `apiClient.post(url, payload, { signal })`. No inventar cancelación manual.
- **`ErrorPanel` y `EmptyState`** viven en `shared/components/` — no requieren modificación en esta historia.
- **MSW server** wired en `frontend/src/test/setup.ts` (Story 2.1) con `beforeAll(server.listen)` + `afterEach(server.resetHandlers)`. Task 14 añade el handler POST y un `resetClienteState()` para tests que mutan la lista.
- **`ToastProvider`** de siesa-ui-kit **no está wired en `main.tsx`** aún (Stories 2.1 y 2.2 sólo usan `ErrorPanel` — sin toasts). Task 8 lo añade justo por dentro del `QueryProvider`.
- **CSS ordering** — `siesa-ui-kit/styles.css` → `react-loading-skeleton/dist/skeleton.css` → `./index.css`; NO cambiar orden.

### Story 1.3 handoff (backend)

- `AppDbContext.Clientes` y `ClienteConfiguration` (Story 2.1) ya declaran `uk_clientes_nit` como unique index. `SaveChangesAsync` con violación producirá `DbUpdateException { InnerException: PostgresException { SqlState: "23505", ConstraintName: "uk_clientes_nit" } }`.
- `ExceptionHandlingMiddleware` sigue siendo la red de seguridad para excepciones no controladas → 500 Problem Details sin stack trace (NFR6). Task 4 asegura que **sólo** las 23505 se traducen a 409 — cualquier otra `DbUpdateException` **debe propagarse** al middleware.
- `AddProblemDetails()` + `UseStatusCodePages()` ya están en `Program.cs` — `Results.ValidationProblem(...)` y `Results.Problem(...)` producen `application/problem+json` correctamente.
- FluentValidation está referenciado en `SiesaAgents.Application.csproj` (`FluentValidation 12.1.1`); el paquete FluentValidation.AspNetCore auto-integration **NO** está referenciado — la integración es manual vía DI + invocación explícita en el endpoint (Task 6). Este es el patrón preferido para Minimal API en .NET 10 según arquitectura.

### Alignment with company standards

**Clean Architecture + DDD (mandatory):**
- Frontend: `modules/crm/clientes/{domain, application, infrastructure, presentation}` — nuevo `create` en repositorio (infrastructure), nuevo hook `useCreateCliente` en application, nuevo schema Zod en application, nuevo `ClienteFormModal` en presentation. **NO** se importa desde otros módulos hermanos; sólo desde `shared/` (per `.claude/agent-memory/sa-quick-dev/company-standards.md`).
- Backend: `SiesaAgents.Domain` (nueva excepción de dominio + `AddAsync` en interface) → `SiesaAgents.Application` (Command + Handler + Validator) → `SiesaAgents.Infrastructure` (impl de `AddAsync`) → `SiesaAgents.API` (endpoint + DI wiring). **Repositorio infrastructure NO captura excepciones** — la política de traducción (23505 → `DuplicateNitException`) vive en el handler de Application, no en el repositorio (respeta la dirección de dependencias).

**Stack (locked):**
- Frontend: React 19, Vite 8, TS 6, TanStack Query 5 (`useMutation` con `setQueryData` + `invalidateQueries`), TanStack Router 1, Zustand 5 (no requerido — el estado del modal es `useState` local), Tailwind v4, siesa-ui-kit `^1.0.255` (`AlertDialog`, `Button`, `Input`, `Toast`, `ToastProvider`, `toast`), Zod 4, React Hook Form 7, `@hookform/resolvers`. No requiere nuevas deps — todo ya está en `package.json`.
- Backend: .NET 10, Minimal API, EF Core 10, `FluentValidation 12.1.1` (ya referenciado), Npgsql 10 (añadir referencia directa en `SiesaAgents.Application.csproj` — Task 4), xUnit, `Microsoft.AspNetCore.Mvc.Testing` (`WebApplicationFactory`) + EF Core InMemory para tests sin Docker.

**Convenciones críticas:**
- **PKs**: `Guid` en backend, `string` (UUID serializado) en frontend — el nuevo `Id` se genera en `ClienteEntity.Create` con `Guid.NewGuid()`. NUNCA `int`.
- **DateTime**: `DateTimeOffset` en backend, `string` (ISO 8601) en frontend — reforzado por `ClienteDto`.
- **Snake_case en DB** via `ApplySnakeCaseNaming()` — la tabla `clientes` ya existe; la columna `nit` con `uk_clientes_nit` ya existe.
- **Problem Details RFC 7807** para todos los errores — 400 (validation), 409 (conflict), 500 (middleware).
- **Scalar** para docs — Swagger prohibido.
- **Texto UI 100% en español (es-CO); código 100% en inglés** — labels ("Nombre", "NIT/RUC", "Teléfono", "Ciudad", "Nuevo cliente", "Guardar", "Cancelar", "Cliente creado correctamente", "El NIT/RUC ya está registrado", "No se pudo guardar. Intenta de nuevo.", "* Campos obligatorios"), placeholders/aria-labels; identifiers, types, functions, tests en inglés.
- **WCAG 2.1 AA** — labels asociados a inputs vía `htmlFor`/`id`, `aria-required`, `aria-invalid`, `aria-describedby` para errores inline, `role="alert"` en mensajes de error inline, contraste ≥ 4.5:1 (`text-red-600` sobre blanco = 5.1:1 ✓), touch targets ≥ 44px (botones `Button` default de siesa-ui-kit son ≥ 40px — verificar en dev; añadir `min-h-[44px]` si el kit no cumple), foco visible en cada elemento tabulable, focus-trap dentro del modal (heredado del `AlertDialog` de siesa-ui-kit — Radix-based).
- **Bundle < 500KB gzipped** — no nuevas dependencias pesadas (siesa-ui-kit ya está; Zod + RHF + resolvers ya están; `@heroicons/react` ya está).
- **Package manager**: `pnpm` (respetar lockfile existente).

**Component hierarchy of decision (obligatoria, per UX spec):**
1. **siesa-ui-kit primero** — `Button` (default para primary, outline para secondary), `Input` (los 4 campos), `AlertDialog` (contenedor del modal), `Toast` + `ToastProvider` + `toast(...)` (feedback).
2. **shadcn/Radix segundo** — no requerido en esta historia (siesa-ui-kit cubre todo).
3. **Custom composition tercero** — `ClienteFormModal` y su sub-componente `Field` son composiciones custom sobre `AlertDialog` + `Input` + Tailwind. NO se crean botones custom.

**MasterCrud (per mastercrud-use-reference.md):**
- **NO se usa en esta historia.** MasterCrud es un orquestador de pantallas CRUD basadas en `MasterCrudField[]` + `CrudService<T>` que combinan grid + form + filters — dimensiona una UI de tabla estándar. Story 2.3 es un formulario modal disparado desde un split-panel (`ClienteListView` + `ClienteDetailView`) — arquitectura ya elegida en el `architecture.md` y ratificada en Stories 2.1/2.2 como composición custom (no tabla). Documentado sin implementar.

**Optimistic UI vs. server-first:**
- **Elegido: server-first con optimistic cache append en `onSuccess`.** Es decir, no hacemos optimistic update **antes** del POST — esperamos el 201, luego insertamos el DTO al head del cache (`setQueryData`) y disparamos `invalidateQueries`. Trade-off razonado:
  - Server-first **evita rollback complejo** en 409 (R-008 mitigation — el UI nunca muestra un cliente que el servidor rechazó);
  - El "flash" percibido es mínimo porque el 201 llega en < 300ms local + `setQueryData` inserta sin refetch;
  - El `invalidateQueries` posterior garantiza que si el backend agregó campos derivados (createdAt server-side), el cliente se re-sincronice — pero como el DTO retornado ya trae `createdAt`, el refetch es puramente defensivo.
  - Alternativa optimistic (rollback en `onError` con `queryClient.setQueryData(..., previous)`) rechazada para mantener la UX previsible en el escenario 409 dominante (R-002 alto).

### Contexto de Story previa (Story 2.2)

Learnings extraídos del `Completion Notes` de Story 2.2 que aplican aquí:
- **`ToastProvider` no montado** — verificar en Task 8 antes de asumir. Tests que asertan sobre toasts **deben** renderizar el provider localmente (`render(<ToastProvider>{ui}</ToastProvider>)`).
- **`server.use(...)` per-test**: cuando un test necesita 409/500, sobrescribir el handler dentro del `beforeEach` o al inicio del `it(...)` — `server.resetHandlers()` restaura defaults.
- **`crypto.randomUUID()`** disponible en `msw` (Node ≥ 18) — no requiere polyfill.
- **`vi.mock('siesa-ui-kit', ...)`** para spy sobre `toast.success` / `toast.error` — patrón: `vi.mock('siesa-ui-kit', async () => { const actual = await vi.importActual<...>('siesa-ui-kit'); return { ...actual, toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) } })`.
- **`useNavigate` de TanStack Router** — no aplica directamente en esta historia (no navegamos tras crear, según AC — sólo cerramos modal). Story 2.2 mockea `useNavigate` en los tests de `ClienteListView` — Task 13 no rompe ese contract porque no toca la selección de items.
- **`cssMinify: false`** en `vite.config.ts` — no revertir.
- **Route file naming**: `routeFileIgnorePattern: '\\.(test|spec)\\.(ts|tsx)$'` — tests co-locados a `src/routes/` deben usar sufijo `.test.tsx` (patrón heredado de Story 2.2 con `clientes.detail.integration.test.tsx`). Task 15 crea `clientes.create.integration.test.tsx` respetando el patrón.

### Test design references

`_bmad-output/test-design-epic-2.md` — Story 2.3 mapea a:
- **P0#1:** Create cliente reflects immediately on list (FR27) — Task 15 integration test happy path.
- **P0#3:** POST /clientes with duplicate NIT/RUC returns 409 (uk_clientes_nit) — Task 7 integration test `CreateCliente_DuplicateNit_Returns409ProblemDetails`.
- **P0#4:** Frontend maps 409 to "El NIT/RUC ya está registrado" and does NOT reveal internals (NFR6) — Task 12 `ClienteFormModal.test.tsx` 409 flow.
- **P0#7:** Each mutation hook invalidates `['clientes']` query key — Task 11 spy on `invalidateQueries`.
- **P0#9:** Required fields validation prevents submit on empty Nombre/NIT/Teléfono/Ciudad (FR8, AC-E2.4) — Task 12 empty-field submit test.
- **P1#13:** Backend input validation rejects `<script>` payloads (NFR5) — parcialmente cubierto por `FluentValidation.MaximumLength`; injection escape es tarea del serializer JSON de .NET (System.Text.Json) que no re-emite HTML — dejamos un test defensivo simple: POST con `<script>alert(1)</script>` como Nombre → 201 (permitido, se persiste como texto plano), y GET posterior devuelve el string tal cual sin ejecutarlo (NFR6 se refiere a stack traces server-side; NFR5 es sanitización — el DTO plain-JSON no ofrece superficie XSS server-side; frontend responsable de escapar al pintar, y React ya lo hace por default).
- **R-002 mitigation:** unique index + 409 mapping + inline UI error — Tasks 4, 6, 7, 11, 12.
- **R-004 mitigation:** `invalidateQueries(['clientes'])` + optimistic `setQueryData` — Task 11.
- **R-008 mitigation:** server-first flow evita rollback (ver "Optimistic UI vs. server-first" arriba).
- **R-011 mitigation:** exactitud del copy de toasts + mensajes inline — Task 12 asserts on exact strings.
- **R-012 mitigation:** trim server-side (`ClienteEntity.Create`) + trim frontend (Zod `.trim()`) — Tasks 3, 9.

**Suite ATDD:** `sa-quick-dev` puede generar `e2e/tests/clientes/story-2.3-create-client.spec.ts` con Playwright + `page.route()` mocks. Los asserts equivalentes viven en Vitest (Tasks 12 y 15) para el sandbox sin Playwright browsers.

### Git intelligence (últimos commits sobre patrones a seguir)

- Story 2.1 (`2cfbdc4`) y Story 2.2 (`3365771`) dejaron el patrón backend `SiesaAgents.{Layer}/Clientes/{Kind}/*.cs`. Replicar para `Commands/CreateClienteCommand.cs`, `Commands/CreateClienteCommandHandler.cs`, `Validators/CreateClienteRequestValidator.cs`, `DTOs/CreateClienteRequest.cs`, y `Domain/Clientes/Exceptions/DuplicateNitException.cs`.
- Story 2.1 (`2cfbdc4`) dejó el patrón frontend `frontend/src/shared/components/{Component}/{Component}.tsx + {Component}.test.tsx + index.ts`. `ClienteFormModal` **NO** vive en `shared/components/` — es específico del módulo `clientes`, así que va en `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.tsx` + `.test.tsx`.
- Story 2.2 (`5280270`) dejó el patrón `wip(epic-2/story-2.2): ...` en los mensajes de commit — respetar el prefijo `wip(epic-2/story-2.3): ...` para consistencia de historial.

### Latest tech info (Web research)

- **React Hook Form 7 + Zod 4** — `zodResolver` acepta directamente el schema; el resolver valida en submit y en cambio/blur según `mode`. Documentación: `@hookform/resolvers` 5+.
- **TanStack Query 5 `useMutation`** — `mutateAsync` retorna una `Promise` que resuelve al DTO o rechaza al `error`; `onSuccess`/`onError` corren después de la resolución. Para invalidación selectiva: `queryClient.invalidateQueries({ queryKey: ['clientes'] })` (no `queryClient.refetchQueries` — invalidate marca como stale y deja que los observadores decidan si refetchean).
- **FluentValidation 12** — `.NotEmpty()` rechaza `null`, `""`, whitespace-only, y `default(T)` para tipos de valor. `.MaximumLength(N)` sólo para strings. Los mensajes son overridable vía `.WithMessage(...)`.
- **Npgsql 10 `PostgresException`** — `SqlState == "23505"` es unique_violation; `ConstraintName` es el nombre del índice. En EF Core 10, `SaveChangesAsync` envuelve la excepción de Npgsql dentro de `DbUpdateException.InnerException`.
- **siesa-ui-kit `AlertDialog`** (dist v1.0.255) — Radix-based dialog con focus trap, Esc-to-close, `size="max-w-md"`, `actions?: ReactNode` para inyectar botones custom (usar `hideCancel + showCloseButton` + `actions` para tener control total). Basado en `frontend/node_modules/siesa-ui-kit/dist/components/AlertDialog/AlertDialog.types.d.ts`.
- **siesa-ui-kit `toast`** — función global que despacha eventos al `ToastProvider` mounted más cercano; opciones: `position`, `duration`, `color`, `icon`, `title`, `description`. Duraciones recomendadas por UX spec: 3s éxito, 5s error.
- **MSW 2 `http.post`** — `({ request }) => await request.json()` para leer el body; `HttpResponse.json(body, { status, headers })` para retornar; para 409 hay que incluir el body Problem Details en JSON.

### Project Structure Notes

**Archivos creados por esta historia:**

Backend:
- `backend/src/SiesaAgents.Domain/Clientes/Exceptions/DuplicateNitException.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteRequestValidatorTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`

Frontend:
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
- `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.test.tsx`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.create.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.test.tsx`
- `frontend/src/routes/clientes.create.integration.test.tsx`

**Archivos modificados por esta historia:**

Backend:
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — añade `AddAsync(ClienteEntity, CancellationToken)`.
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implementa `AddAsync`.
- `backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj` — añade `<PackageReference Include="Npgsql" Version="10.0.3" />`.
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — añade `MapPost("/", ...)` con 201/400/409.
- `backend/src/SiesaAgents.API/Program.cs` — registra `CreateClienteCommandHandler` + `IValidator<CreateClienteRequest>` en DI + usings.
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — añade 5+ tests (201, 400 empty, 400 whitespace, 400 maxlength, 409 duplicate, 409 no leak, trim).
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` (y `GetClienteByIdQueryHandlerTests.cs`) — extiende la fake `IClienteRepository` con stub `AddAsync`.

Frontend:
- `frontend/src/main.tsx` — añade `ToastProvider` de siesa-ui-kit envolviendo el `RouterProvider`.
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — añade tipo `CreateClientePayload` + método `create`.
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implementa `create`.
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — añade botón "Nuevo cliente" en header + cablea CTA del EmptyState al modal + renderiza `<ClienteFormModal />`.
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` — añade 3 tests nuevos.
- `frontend/src/modules/crm/clientes/index.ts` — exporta `ClienteFormModal` y `useCreateCliente`.
- `frontend/src/test/msw/handlers.ts` — añade `http.post` handler + `resetClienteState()` export + `currentClientes` mutable.
- `frontend/src/test/setup.ts` — añade `afterEach(resetClienteState)`.

**NO creados en esta historia:**
- `useUpdateCliente`, `useDeleteCliente` (Stories 2.4, 2.5) — aunque el arquitecto original los previó, esta historia sólo entrega `create`.
- Edit-mode del formulario — `ClienteFormModal` está pensado con `mode` implícito "create" (defaultValues vacíos). Story 2.4 lo extenderá con una prop `initialValues?: Cliente` y un `mode: 'create' | 'edit'` para reutilizarlo.
- Update/Delete endpoints en `ClienteEndpoints.cs` (Stories 2.4, 2.5).
- `SortControl` en `shared/components` (Story 2.6).

**Conflictos detectados y resolución:**
- El `console.info('TODO: Story 2.3 — Create Client')` del CTA del `EmptyState` **se reemplaza** por `setIsFormOpen(true)`. El comportamiento cambia — de un no-op a abrir el modal — pero es exactamente el hand-off que Story 2.1 dejó documentado.
- Los tests heredados de `ClienteListView.test.tsx` que asertan sobre el CTA del `EmptyState` deben seguir verdes porque la firma del componente `EmptyState` no cambia — sólo el `onClick` del CTA. Los mocks de `useNavigate` y `useMatchRoute` establecidos en Story 2.2 siguen siendo compatibles porque el modal no navega.
- `main.tsx` gana un layer (`ToastProvider`) — los tests de rutas que crean su propio `RouterProvider` deben también envolver con `ToastProvider` si asertan sobre toasts (Task 15).

### References

- Epic 2 source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.3]
- Epic 2 AC-E2.1 (crear cliente → aparece en lista) y AC-E2.4 (validación campos requeridos): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Epic 2]
- Functional Requirements FR1, FR8, FR27: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management]
- Non-Functional Requirements NFR2, NFR5, NFR6: [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md]
- Architecture — API endpoints (`POST /api/v1/clientes`): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — Mutation pattern (`invalidateQueries` + toast): [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- Architecture — Backend folder structure (`Commands/`, `Validators/`, `DTOs/`): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Frontend `useCreateCliente` + `clienteSchema.ts` layout: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Error handling (Problem Details RFC 7807, no stack traces, NFR6): [Source: _bmad-output/planning-artifacts/architecture.md#Error handling]
- UX spec — Phase 2 "Nuevo cliente" button + Form Patterns + toast copy: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns, #Form Patterns]
- UX spec — Toasts colors, durations, positions: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns]
- UX spec — Modal/Dialog rules (`Esc`, ✕, backdrop, autoFocus, foco al abridor al cerrar): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Modal & Overlay Patterns]
- Test design epic-2 P0#1, P0#3, P0#4, P0#7, P0#9 + P1#13 + R-002/R-004/R-008/R-011/R-012 mitigations: [Source: _bmad-output/test-design-epic-2.md]
- Story 2.1 handoff (ClienteListView, EmptyState CTA stub, uk_clientes_nit, MSW): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Story 2.2 handoff (getById, IClienteRepository shape, IntegrationTests baseline): [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md]
- Company standards (Clean Arch + DDD, stack, WCAG 2.1 AA, es-CO/EN split, DateTimeOffset, Problem Details, Scalar, snake_case, FluentValidation + Zod split): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- MasterCrud reference (not used in this story — see Alignment section): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- TanStack Query 5 useMutation + invalidateQueries: [Source: https://tanstack.com/query/latest/docs/framework/react/guides/mutations]
- React Hook Form + Zod resolver: [Source: https://react-hook-form.com/docs/useform#resolver]
- FluentValidation 12 rules: [Source: https://docs.fluentvalidation.net/en/latest/built-in-validators.html]
- Npgsql `PostgresException.SqlState`: [Source: https://www.npgsql.org/doc/api/Npgsql.PostgresException.html]
- Problem Details RFC 7807 + RFC 9110 status codes (409): [Source: https://datatracker.ietf.org/doc/html/rfc7807, https://www.rfc-editor.org/rfc/rfc9110#section-15.5.10]

### UI Implementation Requirements (MANDATORY)

- **Library:** `siesa-ui-kit@^1.0.255` (ya instalado desde Story 1.2).
- **Install:** N/A — ya está en `frontend/package.json`.
- **Usage:** Se DEBEN usar componentes de `siesa-ui-kit` para todos los primitivos UI donde exista un equivalente. En esta historia: `Button` (header + form + toast), `Input` (los 4 campos), `AlertDialog` (contenedor del modal), `Toast` + `ToastProvider` + `toast(...)` (feedback de éxito y error).
- **Constraint:** NO crear un `Input`, `Button`, `Modal` ni `Toast` custom. Los componentes custom (`ClienteFormModal`, sub-componente `Field`) son **composiciones** que envuelven primitivos siesa-ui-kit + Tailwind + Heroicons. El modal wrapper NO reemplaza `AlertDialog` — lo instancia con `actions` custom.
- **MasterCrud:** NO aplica a Story 2.3 (justificado en "Alignment with company standards" arriba). Documentar sin implementar.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

- Backend `dotnet build backend/SiesaAgents.sln` → 0 warnings, 0 errors.
- Backend `dotnet test backend/SiesaAgents.sln` → **104 passed / 1 failed**:
  - `SiesaAgents.UnitTests`: 73/73 pass (13 new tests from Story 2.3 — validator + handler).
  - `SiesaAgents.IntegrationTests`: 31/32 pass. The 1 failure is
    `MigrationsAndSnakeCaseTests.GivenEmptyDatabase_WhenApplyingMigrations_...`
    which fails at ctor time because the sandbox has no Docker (Testcontainers
    cannot start a Postgres container). This is a **pre-existing, non-blocking
    sandbox constraint** documented in Story 2.1 & 2.2 handoffs and in the
    `SiesaAgents.IntegrationTests/README.md` (test-design R-013 fallback).
- Frontend `pnpm --filter frontend exec tsc -b --noEmit` → clean (0 errors).
- Frontend `pnpm --filter frontend lint` (`oxlint`) → 5 pre-existing warnings on
  route files unrelated to Story 2.3; 0 new issues from any file touched by
  this story.
- Frontend `pnpm --filter frontend test` → **160 tests / 23 files pass** (up
  from 121 pre-Story-2.3 baseline; +~40 tests added by this story across the
  schema, repository, mutation hook, form modal, list view Story 2.3 tests,
  and route integration).
- Frontend `pnpm --filter frontend build` → succeeds (dist/index-CUzdylIO.js
  ~85 KB gzip; largest chunk is siesa-ui-kit vendor at 366 KB gzip, within
  the < 500 KB budget for the app chunk).
- Playwright suite (`e2e/tests/clientes/story-2.3-create-client.spec.ts` and
  `e2e/tests/api/story-2.3-create-client.api.spec.ts`) **not executed in this
  sandbox** because Playwright browsers are not installed and no running
  backend + Postgres is available. Their equivalents live in Vitest (Task 12
  and Task 15 tests) and in the backend integration tests (Task 7). The
  Playwright tests are ready to run once a full environment is available.

### Completion Notes List

- **All 16 tasks completed** and all mandated ACs (1-8) are enforced by the
  test suites above.
- **AlertDialog children slot**: the story-spec example placed the `<form>` as
  `children` of siesa-ui-kit's `AlertDialog`, but the component's runtime
  ignores `children` and only renders `title` + `description` + `actions`. The
  form was placed in `description` (which accepts `ReactNode`); functionally
  identical, but code-review readers should not be surprised.
- **Button prop naming**: siesa-ui-kit `Button` uses `type` for the visual
  variant (`default | outline | plain`) and `htmlType` for the HTML button
  behaviour (`button | submit | reset`). The story-spec pseudocode used
  `variant=` which does not exist in the kit — corrected during implementation.
- **`useEffect` deps in `ClienteFormModal`**: initial implementation depended
  on the full `createMutation` object which is a new instance per render; that
  caused an infinite loop → OOM in vitest workers. Fixed by depending only on
  `isOpen` and calling `createMutation.reset()` inside the effect body (with
  an explicit eslint-disable for `exhaustive-deps` on that specific hook).
- **409 code-path in integration tests**: `EF Core InMemory 10` does NOT
  enforce unique indexes on `SaveChangesAsync` — the InMemory provider
  silently persists duplicate NITs. The "true" 23505 → `DuplicateNitException`
  → 409 code path is validated by unit tests on the handler
  (`CreateClienteCommandHandlerTests`) using synthetic `PostgresException`
  instances, and by the E2E API contract test
  (`story-2.3-create-client.api.spec.ts`) when a real Postgres is available.
- **`Npgsql` package**: added as an explicit `PackageReference` (10.0.3) to
  `SiesaAgents.Application.csproj` so `Npgsql.PostgresException` can be
  imported by the handler. Also added `Microsoft.EntityFrameworkCore` (10.0.*)
  since the handler now catches `DbUpdateException`.
- **ToastProvider wiring**: `main.tsx` now nests
  `<QueryProvider><ToastProvider><RouterProvider/>` so every route can
  invoke `toast.success/error` from siesa-ui-kit. Vitest suites that need to
  spy on `toast.*` use `vi.mock('siesa-ui-kit', ...)` locally — this pattern
  is documented in Story 2.2 handoff notes and applied consistently here.
- **MSW handlers state**: added a mutable `currentClientes` array + exported
  `resetClienteState()`; `src/test/setup.ts` calls it in `afterEach` so the
  POST-mutation tests do not contaminate the next test's initial list.
- **UI copy is 100% Spanish**, code is 100% English (per company standards);
  labels: `"Nombre"`, `"NIT/RUC"`, `"Teléfono"`, `"Ciudad"`, `"Nuevo cliente"`,
  `"Guardar"`, `"Cancelar"`, `"Guardando..."`, `"* Campos obligatorios"`;
  toast copy: `"Cliente creado correctamente"` (green, 3s) and
  `"No se pudo guardar. Intenta de nuevo."` (red, 5s); inline errors match the
  exact strings in AC#3 and AC#5.
- **Accessibility**: every `<Input>` receives `aria-required="true"`,
  `aria-invalid` (on error), `aria-describedby="{field}-error"`, and its
  error `<p>` has `role="alert"`. AlertDialog + HeadlessUI provide focus-trap
  + Esc-to-close inherently.
- **NFR6 defense-in-depth**: the frontend never renders `error.response.data`
  content to the DOM on 409; only the fixed inline copy `"El NIT/RUC ya está
  registrado"` and no toast. Modal-level test asserts the Problem Details
  `detail` / `title` do not appear anywhere in the DOM. Backend integration
  tests assert 400 body contains no `System.*`, `Microsoft.EntityFrameworkCore`,
  or `.cs:line` signals.

### File List

**Backend — files created:**
- `backend/src/SiesaAgents.Domain/Clientes/Exceptions/DuplicateNitException.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteRequestValidatorTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`

**Backend — files modified:**
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — added `AddAsync`.
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implemented `AddAsync`.
- `backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj` — added `Npgsql 10.0.3` and `Microsoft.EntityFrameworkCore 10.0.*` package refs.
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — added `MapPost("/", ...)` with 201/400/409 branches.
- `backend/src/SiesaAgents.API/Program.cs` — registered `CreateClienteCommandHandler` and `IValidator<CreateClienteRequest>` in DI + added `using`s.
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — added 6 new tests (201, 400 empty Nombre, 400 whitespace all, 400 NIT MaxLength, trim server-side, camelCase keys). 409 branch documented in inline note (EF Core InMemory limitation).
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` — extended fake `IClienteRepository` with `AddAsync` stub.
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` — extended fake `IClienteRepository` with `AddAsync` stub.

**Frontend — files created:**
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
- `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.test.tsx`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.create.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.test.tsx`
- `frontend/src/routes/clientes.create.integration.test.tsx`

**Frontend — files modified:**
- `frontend/src/main.tsx` — wraps `RouterProvider` with `ToastProvider`.
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — added `CreateClientePayload` type and `create(...)` method.
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implemented `create`.
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — added header `"Nuevo cliente"` button, wired both entry points to `setIsFormOpen(true)`, renders `<ClienteFormModal />`.
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` — updated empty-state assertion (there are now two `"Nuevo cliente"` buttons) and added 3 new Story 2.3 tests.
- `frontend/src/modules/crm/clientes/index.ts` — exports `ClienteFormModal` and `useCreateCliente`.
- `frontend/src/test/msw/handlers.ts` — added `http.post('*/api/v1/clientes', ...)` handler with duplicate-NIT 409 branch + mutable `currentClientes` + exported `resetClienteState()`.
- `frontend/src/test/setup.ts` — added `resetClienteState()` call inside `afterEach`.
