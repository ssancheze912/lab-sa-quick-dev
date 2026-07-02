# Story 2.4: Edit Client

Status: implemented

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit any field of an existing client,
so that the client information stays up to date.

## Acceptance Criteria

1. **Given** el usuario está viendo el detalle de un cliente en `/clientes/:clienteId` (`ClienteDetailView` renderizado con `data-testid="cliente-detail-panel"` y datos cargados), **When** el header del panel de detalle se renderiza, **Then** junto al `<h2 id="cliente-detail-title">` con el nombre del cliente se muestra un botón secundario `siesa-ui-kit` `Button` con texto `"Editar"` (`type="outline"`, `htmlType="button"`, `data-testid="cliente-editar-button"`, `aria-label="Editar cliente"`, ícono opcional `PencilSquareIcon` de Heroicons a la izquierda del texto). El botón es visible únicamente cuando `cliente` está cargado (no en `isLoading`, `isError`/404, ni estado placeholder "Selecciona un cliente"). Al hacer click, el estado local `isEditOpen` del `ClienteDetailView` pasa a `true` y abre el modal `ClienteFormModal` en modo `"edit"`, pasando `initialValues={cliente}` y `clienteId={cliente.id}`. (FR6, AC-E2.3, UX spec — "Detail panel actions" + "Button secondary — `Cancelar`, `Editar`" — mitiga R-005 al canalizar la edición por un único punto de entrada)

2. **Given** el usuario abre el modal `ClienteFormModal` en modo `"edit"` para un cliente `X`, **When** el modal termina de montar, **Then**:
   - El `siesa-ui-kit` `AlertDialog` (`size="max-w-md"`, `isOpen=true`, `showCloseButton=true`, `hideCancel=true`, `title="Editar cliente"` — **no** `"Nuevo cliente"`) contiene el mismo `<form>` con **exactamente cuatro** campos `siesa-ui-kit` `Input` en el orden `Nombre*`, `NIT/RUC*`, `Teléfono*`, `Ciudad*`, con los mismos `data-testid` estables (`cliente-form-nombre`, `cliente-form-nit`, `cliente-form-telefono`, `cliente-form-ciudad`), los mismos `maxLength` (200/50/50/100) y la misma leyenda `"* Campos obligatorios"`.
   - Cada `Input` está **pre-llenado con el valor actual del cliente**: `nombre = cliente.nombre`, `nit = cliente.nit`, `telefono = cliente.telefono`, `ciudad = cliente.ciudad`. La pre-carga usa `defaultValues` de React Hook Form (`useForm({ defaultValues: initialValues })`) más `reset(initialValues)` cuando `isOpen` pasa a `true`, para garantizar que reabrir el modal tras cerrar sin guardar restaura los valores originales del cliente (no residuo del intento previo).
   - El foco automático inicial va sobre el input `Nombre` (`setFocus('nombre')`).
   - Los botones de `actions` son: `"Cancelar"` (`type="outline"`, `data-testid="cliente-form-cancel"`) y `"Guardar"` (`type="default"`, `htmlType="submit"`, `data-testid="cliente-form-submit"`, `disabled={isSubmitting}`). El label del botón "Guardar" pasa a `"Guardando..."` durante la mutación.

   (FR6, AC-E2.3 — UX spec Form Patterns — test-design-epic-2 P1#7 "Edit form pre-filled with current values")

3. **Given** el modal `ClienteFormModal` está abierto en modo `"edit"`, **When** el usuario envía el `<form>` con uno o más campos requeridos vacíos o con solo whitespace, **Then** React Hook Form (integrado con `zodResolver(clienteFormSchema)` — el **mismo** schema Zod reutilizado de Story 2.3 — sin duplicar reglas) impide la llamada HTTP (`onSubmit` **no se ejecuta**) y muestra debajo de cada campo inválido un mensaje inline en `text-sm text-red-600`:
   - `Nombre` vacío/whitespace → `"El nombre es requerido"`
   - `NIT/RUC` vacío/whitespace → `"El NIT/RUC es requerido"`
   - `Teléfono` vacío/whitespace → `"El teléfono es requerido"`
   - `Ciudad` vacío/whitespace → `"La ciudad es requerida"`

   Cada mensaje se asocia al `Input` correspondiente vía `aria-describedby="{field}-error"` y `aria-invalid="true"`; el `<p>` del mensaje tiene `role="alert"`. La validación se dispara `onBlur` de cada campo y también en `onSubmit`; al re-hacerse válido (`onChange` tras primer error), el mensaje desaparece automáticamente. **Ninguna petición PUT** llega al backend en este caso — verificable con MSW request counter. (FR8, AC-E2.4 — test-design-epic-2 P0#9 aplicado al flujo edit)

4. **Given** el usuario modifica uno o más campos del formulario con valores válidos y hace click en `"Guardar"`, **When** `handleSubmit` valida OK y ejecuta la mutación `useUpdateCliente(clienteId)`, **Then**:
   - El frontend envía `PUT /api/v1/clientes/{clienteId}` con body JSON camelCase `{ nombre, nit, telefono, ciudad }` — todos los strings previamente `.trim()`-eados por Zod (`z.string().trim().min(1, ...)`).
   - El botón `"Guardar"` pasa a `disabled` + muestra label `"Guardando..."`.
   - El backend responde `200 OK` con body `ClienteDto` completo (id, nombre, nit, telefono, ciudad, createdAt, `updatedAt` **refrescado** por el servidor).
   - La mutación en `onSuccess` (a) reemplaza la entrada del cliente dentro del cache `['clientes']` vía `queryClient.setQueryData(['clientes'], (prev) => prev?.map(c => c.id === updated.id ? updated : c))` (sin cambiar el orden — la posición del cliente se preserva; **NO** se re-inserta al head como en Create), y (b) también reemplaza el cache `['clientes', clienteId]` vía `queryClient.setQueryData(['clientes', clienteId], updated)` para que `ClienteDetailView` refleje el cambio inmediatamente, y (c) invalida ambas keys (`['clientes']` y `['clientes', clienteId]`) para reconciliación con el servidor (FR27, R-004 mitigation).
   - El modal se cierra (`setIsEditOpen(false)`) y el form se resetea al estado limpio (`form.reset(updated)` — el próximo `open` en edit mode arrancará con los valores nuevos ya persistidos).
   - Se dispara `toast.success("Cliente actualizado correctamente", { position: "bottom-right", duration: 3000, color: "green" })` (siesa-ui-kit `toast`).
   - El panel de detalle (`ClienteDetailView`) muestra los valores nuevos sin recarga de página (reflejo < 2s — NFR2).
   - La lista lateral (`ClienteListView`) muestra el `ClientListItem` con `nombre`/`nit` actualizados en la misma posición (FR27, AC-E2.3 — "los cambios se reflejan en el detalle y la lista").

   (FR6, FR27, NFR2, AC-E2.3 — test-design-epic-2 P0#1 "Edit reflects immediately on list", P0#7 "invalidateQueries", P1#10 "PUT /clientes/{id} updates only mutable fields; created_at unchanged")

5. **Given** el usuario envía el formulario con un `NIT/RUC` que **ya existe en otro cliente** (no en el que está editando), **When** el backend detecta la violación del índice único `uk_clientes_nit` y responde `409 Conflict` con Problem Details RFC 7807 (`title: "NIT/RUC duplicado"`, `status: 409`, `detail: "Ya existe un cliente con el NIT/RUC indicado."`, `instance: /api/v1/clientes/{id}`, con `field: "nit"` **plano al top-level** — coincide con la serialización real de `Results.Problem(extensions: ...)` en ASP.NET), **Then** el frontend intercepta la respuesta en `useUpdateCliente.onError`:
   - **No** cierra el modal — el usuario mantiene el formulario para poder corregir el NIT/RUC.
   - Marca el campo `NIT/RUC` con `aria-invalid="true"` + borde rojo (`text-red-600`), y muestra el mensaje inline `"El NIT/RUC ya está registrado"` **debajo del input** — texto **exacto**, sin exponer `detail`, `type`, `instance` ni ningún otro campo del Problem Details (NFR6).
   - El botón `"Guardar"` vuelve a `disabled=false` con label `"Guardar"`.
   - **NO** se dispara un toast rojo — el error 409 es un error de validación de negocio y su tratamiento correcto es inline (patrón UX spec — Feedback Patterns).
   - El mensaje `"El NIT/RUC ya está registrado"` es el **único** string mostrado al usuario final; ningún stack trace, mensaje interno del backend, ni ruta técnica llega al DOM (NFR6 audit).

   **Corolario:** si el usuario deja el `NIT/RUC` **exactamente igual al actual** del cliente (o solo cambia otros campos), el backend NO retorna 409 — el índice único no se viola porque la fila que sostiene ese NIT es el mismo registro que se está actualizando. El test `UpdateCliente_SameNit_NoConflict` en Task 7 lo asegura. (NFR6, AC-E2.3 — R-002 mitigation)

6. **Given** el `clienteId` de la URL/prop no existe (o fue eliminado por otra sesión), **When** el frontend envía `PUT /api/v1/clientes/{clienteId}` y el backend responde `404 Not Found` con Problem Details (`title: "Cliente no encontrado"`, `status: 404`), **Then**:
   - El modal permanece abierto y los campos conservan los valores editados.
   - Se dispara `toast.error("No se pudo guardar. Intenta de nuevo.", { position: "bottom-right", duration: 5000, color: "red" })` (siesa-ui-kit `toast` — UX spec Feedback Patterns tabla "Error de red (save)" — no se distingue 404 y 5xx a nivel de copy al usuario porque ambos son errores no-recuperables inline; el 404 lo maneja el detalle general con NotFoundClientePanel al refetch después).
   - El botón `"Guardar"` vuelve a `disabled=false`.
   - `queryClient.invalidateQueries({ queryKey: ['clientes'] })` se dispara en `onError` **solo** cuando el status es 404 (no en 409 ni 5xx puros) para que la lista se refresque y el registro fantasma desaparezca — mitigación defensiva de race de sesión con Delete de otra pestaña.
   - **NO** se muestra el `detail` técnico ni stack trace (NFR6).

   (NFR6, UX spec — Error & Recovery Patterns)

7. **Given** el backend está inalcanzable (5xx puro, network error, timeout) durante la submission, **When** la mutación reporta `isError === true` con `error.response?.status ∉ {400, 404, 409}` (o sin respuesta HTTP), **Then**:
   - El modal permanece abierto y los campos conservan los valores editados (el usuario no pierde su entrada).
   - Se dispara `toast.error("No se pudo guardar. Intenta de nuevo.", { position: "bottom-right", duration: 5000, color: "red" })`.
   - El botón `"Guardar"` vuelve a `disabled=false`.
   - **NO** se muestra el `detail` técnico ni stack trace (NFR6). Los 400 con Problem Details (validación server-side extra que Zod no anticipó — rama defensiva porque FluentValidation ya cubre lo mismo que Zod) siguen el mismo path del toast rojo.

   (NFR6, UX spec — Error & Recovery Patterns)

8. **Given** el usuario hace click en `"Cancelar"` (o en la ✕ del `AlertDialog`, o presiona `Esc`), **When** el modal se cierra sin submit, **Then**:
   - `onClose` del modal se dispara (invocado por el `siesa-ui-kit` `AlertDialog` en cualquiera de los 3 gestos gracias a Radix/HeadlessUI focus-trap + Esc handler).
   - `setIsEditOpen(false)` en `ClienteDetailView` remueve el modal del DOM.
   - React Hook Form ejecuta `reset()` (sin argumentos → vuelve a los `defaultValues` que fueron los `initialValues` del cliente actual) — así, si el usuario reabre el modal, los inputs muestran los valores **originales** del cliente, no los que estaba editando.
   - El estado del cliente en TanStack Query `['clientes', clienteId]` **NO cambia**: no hubo PUT, no hubo `setQueryData`. El `ClienteDetailView` sigue mostrando los valores originales.
   - La lista lateral (`ClienteListView`) sigue con los datos originales — cero cambios en el cache `['clientes']`.
   - **NO** se dispara ningún toast (ni éxito ni error).

   (AC-E2.3 — UX spec Modal & Overlay Patterns — mitigación implícita de R-008: sin PUT, sin rollback necesario)

9. **Given** el backend expone `PUT /api/v1/clientes/{id:guid}`, **When** el frontend hace la petición con body JSON válido y un `id` que existe, **Then** el endpoint responde:
   - **200 OK** + body `ClienteDto` completo (id, nombre, nit, telefono, ciudad, createdAt **INMUTABLE**, updatedAt **actualizado a `DateTimeOffset.UtcNow`**) cuando la actualización es exitosa. El `id` retornado coincide exactamente con el `id` de la URL — el backend NUNCA acepta cambio de PK. El body de request **no** incluye `id`, `createdAt` ni `updatedAt` — sólo los 4 campos mutables.
   - **400 Bad Request** con Problem Details RFC 7807 (`errors: { nombre?: string[], nit?: string[], telefono?: string[], ciudad?: string[] }`) cuando algún campo requerido está vacío, whitespace-only, o excede el `MaxLength` (200/50/50/100). FluentValidation se ejecuta **antes** de tocar la base de datos.
   - **404 Not Found** con Problem Details (`title: "Cliente no encontrado"`, `status: 404`, `detail: "No existe ningún cliente con id {id}."`, `type` estándar RFC 9110) cuando no existe cliente con ese `id`.
   - **409 Conflict** con Problem Details (`title: "NIT/RUC duplicado"`, `status: 409`, `detail: "Ya existe un cliente con el NIT/RUC indicado."`, `field: "nit"` inyectado vía `extensions`) cuando la persistencia falla por violación de `uk_clientes_nit` (mapeado desde `DbUpdateException` cuya inner exception es `Npgsql.PostgresException` con `SqlState == "23505"` **y** `ConstraintName == "uk_clientes_nit"`). El caso "usuario deja el mismo NIT que ya tenía el cliente" NO produce 409 porque el registro que sostiene ese NIT es el mismo que se está actualizando.
   - **400 Bad Request** automático por route constraint `{id:guid}` cuando el segmento no parsea como GUID (comportamiento estándar de Minimal API — cumple NFR6).

   Implementación .NET 10 Minimal API + EF Core 10 siguiendo Clean Architecture + DDD/CQRS:
   - **Domain**: `IClienteRepository.UpdateAsync(ClienteEntity, CancellationToken)` — persiste una entidad ya trackeada. `ClienteEntity.Update(nombre, nit, telefono, ciudad)` (nuevo método de instancia) actualiza los 4 campos mutables + `UpdatedAt = DateTimeOffset.UtcNow`, aplicando `.Trim()` y las mismas invariantes que `Create`. `Id` y `CreatedAt` son inmutables (`private set` — el método `Update` no los toca).
   - **Application/CQRS**: `UpdateClienteCommand(Guid Id, string Nombre, string Nit, string Telefono, string Ciudad)` + `UpdateClienteCommandHandler.HandleAsync` que (a) llama `IClienteRepository.GetByIdAsync(id, ct)` — si retorna `null`, **lanza `ClienteNotFoundException`** (nueva excepción de dominio); (b) llama `entity.Update(...)`; (c) persiste vía `IClienteRepository.UpdateAsync(entity, ct)`; (d) captura `DbUpdateException` con `PostgresException.SqlState == "23505"` y `ConstraintName == "uk_clientes_nit"` y **lanza `DuplicateNitException`** (misma excepción de Story 2.3 — reutilizada); (e) retorna el `ClienteDto` de la entidad actualizada.
   - **Application/Validators**: `UpdateClienteRequestValidator : AbstractValidator<UpdateClienteRequest>` (FluentValidation) con reglas **idénticas** a `CreateClienteRequestValidator` (mismos `.NotEmpty().MaximumLength(N)` para los 4 campos con los mismos mensajes en español). Registrado en DI vía `builder.Services.AddScoped<IValidator<UpdateClienteRequest>, UpdateClienteRequestValidator>()`.
   - **Infrastructure**: `ClienteRepository.UpdateAsync(ClienteEntity, CancellationToken)` hace `_db.Clientes.Update(entity)` (o solo `SaveChangesAsync` si la entidad ya está tracked por `GetByIdAsync` — ver Task 2 para la decisión de tracking).
   - **API**: Endpoint `group.MapPut("/{id:guid}", async (Guid id, UpdateClienteRequest req, IValidator<UpdateClienteRequest> validator, UpdateClienteCommandHandler handler, HttpContext http, CancellationToken ct) => { … })` que (a) invoca `validator.ValidateAsync(req)` → si falla, retorna `Results.ValidationProblem(errors, 400, ...)`; (b) invoca el handler dentro de un `try` — si captura `ClienteNotFoundException`, retorna `Results.Problem(title, detail, 404, ...)`; si captura `DuplicateNitException`, retorna `Results.Problem(title, detail, 409, ..., extensions: { field: "nit" })`; (c) si éxito, retorna `Results.Ok(dto)`.

   Todas las respuestas usan Problem Details RFC 7807; el `ExceptionHandlingMiddleware` sigue siendo la red de seguridad para excepciones no controladas → 500 sin stack trace (NFR6). (Architecture — API & Communication Patterns + Error handling — test-design-epic-2 P0#1, P1#10)

10. **Given** el proyecto tiene suites de test verdes de las historias anteriores (1.1, 1.2, 1.3, 2.1, 2.2, 2.3), **When** se ejecutan `pnpm --filter frontend build`, `pnpm --filter frontend lint`, `pnpm --filter frontend test`, `dotnet build`, `dotnet test`, **Then** todos completan con **cero errores TypeScript**, cero errores de lint, y **todos los tests unitarios/de componente/de integración pasan** — incluyendo los nuevos tests listados en Tasks 5, 7, 11, 13, 14 y 16, y sin regresiones en los ~160 tests de frontend + ~104 tests de backend heredados de Story 2.3. (Company standards — test-design-epic-2 NFR6 compliance)

## Tasks / Subtasks

- [ ] **Task 1 — Backend Domain: `Update` en `ClienteEntity` + `UpdateAsync` en `IClienteRepository` + `ClienteNotFoundException`** (AC: #4, #9)
  - [ ] Editar `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — añadir método de instancia:
    ```csharp
    /// <summary>
    /// Mutates the 4 editable fields and refreshes UpdatedAt. Id and CreatedAt
    /// are preserved (Id is the immutable PK; CreatedAt is a historical audit
    /// timestamp). All inputs are trimmed and validated with the same
    /// invariants as <see cref="Create"/> — a validator gap must not silently
    /// persist whitespace.
    /// </summary>
    public void Update(string nombre, string nit, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre))
        {
            throw new ArgumentException("Nombre requerido", nameof(nombre));
        }

        if (string.IsNullOrWhiteSpace(nit))
        {
            throw new ArgumentException("NIT requerido", nameof(nit));
        }

        if (string.IsNullOrWhiteSpace(telefono))
        {
            throw new ArgumentException("Telefono requerido", nameof(telefono));
        }

        if (string.IsNullOrWhiteSpace(ciudad))
        {
            throw new ArgumentException("Ciudad requerido", nameof(ciudad));
        }

        Nombre = nombre.Trim();
        Nit = nit.Trim();
        Telefono = telefono.Trim();
        Ciudad = ciudad.Trim();
        UpdatedAt = DateTimeOffset.UtcNow;
    }
    ```
  - [ ] Crear `backend/src/SiesaAgents.Domain/Clientes/Exceptions/ClienteNotFoundException.cs`:
    ```csharp
    namespace SiesaAgents.Domain.Clientes.Exceptions;

    /// <summary>
    /// Thrown by a use case when the requested Cliente does not exist. Mapped to
    /// a 404 Problem Details by the endpoint — this is a known, non-exceptional
    /// outcome (never leaks stack traces per NFR6).
    /// </summary>
    public sealed class ClienteNotFoundException : Exception
    {
        public Guid Id { get; }

        public ClienteNotFoundException(Guid id)
            : base($"No existe ningún cliente con id {id}.")
        {
            Id = id;
        }
    }
    ```
  - [ ] Editar `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — añadir:
    ```csharp
    /// <summary>
    /// Persists mutations on a tracked ClienteEntity. Callers must catch
    /// DbUpdateException whose inner PostgresException.SqlState == "23505"
    /// and ConstraintName == "uk_clientes_nit" to map duplicate-NIT violations
    /// to a domain-level DuplicateNitException.
    /// </summary>
    Task UpdateAsync(ClienteEntity cliente, CancellationToken cancellationToken = default);
    ```
  - [ ] `dotnet build src/SiesaAgents.Domain` → 0 errores.

- [ ] **Task 2 — Backend Infrastructure: `ClienteRepository.UpdateAsync`** (AC: #4, #9)
  - [ ] Editar `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — añadir:
    ```csharp
    public async Task UpdateAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
    {
        // GetByIdAsync uses AsNoTracking (Story 2.2), so the entity returned to
        // the handler is detached. We reattach it as Modified so EF Core writes
        // the mutated columns. `.Update(entity)` marks ALL properties dirty; that
        // is intentional — the DTO always ships the four mutable fields and the
        // domain method refreshes UpdatedAt, so the diff is deterministic. It
        // also lets DbUpdateException bubble up (23505 mapping happens in the
        // application handler — Clean Architecture: infra reports, application
        // decides).
        _db.Clientes.Update(cliente);
        await _db.SaveChangesAsync(cancellationToken);
    }
    ```
  - [ ] Verificar que **no** hay `try/catch` en el repositorio — la política de traducción (23505 → `DuplicateNitException`, no-found → `ClienteNotFoundException`) vive en el handler.
  - [ ] `dotnet build src/SiesaAgents.Infrastructure` → 0 errores.

- [ ] **Task 3 — Backend Application: `UpdateClienteRequest` DTO + `UpdateClienteRequestValidator`** (AC: #3, #9)
  - [ ] Crear `backend/src/SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs`:
    ```csharp
    namespace SiesaAgents.Application.Clientes.DTOs;

    /// <summary>
    /// Input payload for PUT /api/v1/clientes/{id}. Only the four mutable
    /// fields — the id comes from the route, and createdAt/updatedAt are
    /// server-managed audit columns. All fields are required and trimmed
    /// server-side. Duplicate NIT is enforced at DB level (uk_clientes_nit)
    /// and reported as 409 Problem Details.
    /// </summary>
    public sealed record UpdateClienteRequest(
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad);
    ```
  - [ ] Crear `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs`:
    ```csharp
    using FluentValidation;
    using SiesaAgents.Application.Clientes.DTOs;

    namespace SiesaAgents.Application.Clientes.Validators;

    /// <summary>
    /// FluentValidation rules for UpdateClienteRequest. Identical rules to
    /// <see cref="CreateClienteRequestValidator"/> (mirrors 200/50/50/100 column
    /// limits) — kept as its own class so the contract can diverge in future
    /// stories without a coupling break.
    /// </summary>
    public sealed class UpdateClienteRequestValidator : AbstractValidator<UpdateClienteRequest>
    {
        public UpdateClienteRequestValidator()
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
  - [ ] `dotnet build src/SiesaAgents.Application` → 0 errores.

- [ ] **Task 4 — Backend Application: `UpdateClienteCommand` + Handler** (AC: #4, #5, #6, #9)
  - [ ] Crear `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`:
    ```csharp
    namespace SiesaAgents.Application.Clientes.Commands;

    public sealed record UpdateClienteCommand(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad);
    ```
  - [ ] Crear `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`:
    ```csharp
    using Microsoft.EntityFrameworkCore;
    using Npgsql;
    using SiesaAgents.Application.Clientes.DTOs;
    using SiesaAgents.Domain.Clientes.Exceptions;
    using SiesaAgents.Domain.Clientes.Interfaces;

    namespace SiesaAgents.Application.Clientes.Commands;

    /// <summary>
    /// Executes the "update cliente" use case:
    ///   1. Fetches the entity by id — <see cref="ClienteNotFoundException"/>
    ///      when null (mapped to 404 by the endpoint).
    ///   2. Applies the domain mutation via <see cref="ClienteEntity.Update"/>
    ///      (which trims + enforces NotEmpty invariants — defence-in-depth
    ///      against a validator gap and refreshes UpdatedAt).
    ///   3. Persists via IClienteRepository.UpdateAsync.
    ///   4. Translates PostgreSQL 23505 (unique_violation on uk_clientes_nit)
    ///      into a domain-level DuplicateNitException (reused from Story 2.3).
    ///      Any other DbUpdateException bubbles up to
    ///      ExceptionHandlingMiddleware (500 Problem Details).
    /// </summary>
    public sealed class UpdateClienteCommandHandler
    {
        private readonly IClienteRepository _repository;

        public UpdateClienteCommandHandler(IClienteRepository repository)
        {
            _repository = repository;
        }

        public async Task<ClienteDto> HandleAsync(
            UpdateClienteCommand command,
            CancellationToken cancellationToken = default)
        {
            var entity = await _repository.GetByIdAsync(command.Id, cancellationToken)
                ?? throw new ClienteNotFoundException(command.Id);

            entity.Update(
                command.Nombre,
                command.Nit,
                command.Telefono,
                command.Ciudad);

            try
            {
                await _repository.UpdateAsync(entity, cancellationToken);
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
            return ex.InnerException is PostgresException pg
                   && pg.SqlState == "23505"
                   && (pg.ConstraintName is null
                       || pg.ConstraintName.Equals("uk_clientes_nit", StringComparison.OrdinalIgnoreCase));
        }
    }
    ```
  - [ ] `Npgsql` y `Microsoft.EntityFrameworkCore` ya están referenciados en `SiesaAgents.Application.csproj` desde Story 2.3 — no requiere cambios de csproj.
  - [ ] `dotnet build src/SiesaAgents.Application` → 0 errores.

- [ ] **Task 5 — Backend Tests: Unit (handler + validator)** (AC: #3, #4, #5, #6, #9, #10)
  - [ ] `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteRequestValidatorTests.cs` (patrón hermano de `CreateClienteRequestValidatorTests`):
    - `Validate_AllFieldsValid_Succeeds()` — payload mínimo válido pasa.
    - `Validate_EmptyField_FailsWithExpectedMessage(string field)` — parametrizado para los 4 campos vacíos → `"El nombre es requerido."`, `"El NIT/RUC es requerido."`, `"El teléfono es requerido."`, `"La ciudad es requerida."`.
    - `Validate_WhitespaceOnlyField_Fails(string field)` — 4 casos con espacios/tabs → `.NotEmpty()` de FluentValidation rechaza whitespace.
    - `Validate_FieldExceedsMaxLength_Fails(string field, int max)` — 4 casos: 201/51/51/101 chars.
  - [ ] `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`:
    - `HandleAsync_ExistingId_UpdatesAndReturnsDto()` — fake `IClienteRepository.GetByIdAsync` retorna una `ClienteEntity` seed; asserta `UpdateAsync` fue invocado con la misma entidad **con los nuevos valores trim-eados** y `UpdatedAt` distinto al `CreatedAt` original; asserta el DTO retornado con `id` intacto y `updatedAt > createdAt`.
    - `HandleAsync_UnknownId_ThrowsClienteNotFound()` — fake `GetByIdAsync` retorna `null` → asserta `ClienteNotFoundException` con propiedad `Id` == command.Id; asserta que `UpdateAsync` **NUNCA** fue invocado.
    - `HandleAsync_RepositoryThrowsUniqueViolation_ThrowsDuplicateNit()` — fake `UpdateAsync` lanza `new DbUpdateException("...", new PostgresException("...", "23505", "23505", "uk_clientes_nit"))` → asserta que el handler lanza `DuplicateNitException` cuya propiedad `Nit` coincide con el nuevo NIT.
    - `HandleAsync_RepositoryThrowsOtherDbUpdate_Propagates()` — fake `UpdateAsync` lanzando `DbUpdateException` con `PostgresException` de SQL state `"23000"` y otro constraint → asserta que el handler **NO** captura — la excepción se propaga (será 500 por middleware).
    - `HandleAsync_PassesCancellationToken()` — verifica que el token del command llega intacto tanto al `GetByIdAsync` como al `UpdateAsync`.
    - `HandleAsync_PreservesIdAndCreatedAt()` — asserta que `entity.Id` y `entity.CreatedAt` no cambian antes/después de `Update` (invariantes del método `Update`).
  - [ ] `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityUpdateTests.cs` (o extender `ClienteEntityTests.cs` si existe — Story 2.1 lo creó):
    - `Update_ValidValues_MutatesFieldsAndRefreshesUpdatedAt()` — construye entidad con `Create(...)`, guarda `originalCreatedAt`/`originalUpdatedAt`, awaits ~1ms, invoca `Update(...)`, asserta `Nombre/Nit/Telefono/Ciudad` cambian y son trim-eados, `Id`/`CreatedAt` iguales, `UpdatedAt > originalUpdatedAt`.
    - `Update_EmptyField_Throws(string field)` — parametrizado para los 4 campos → `ArgumentException` con `paramName` esperado.
    - `Update_WhitespaceOnly_Throws(string field)` — 4 casos.
    - `Update_TrimsAllFields()` — inputs con espacios al inicio/fin → asserta valores persistidos sin espacios.
  - [ ] Actualizar las fakes `IClienteRepository` en `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`, `GetClienteByIdQueryHandlerTests.cs`, `CreateClienteCommandHandlerTests.cs` si comparten un doble — añadir stub de `UpdateAsync` que lance `NotImplementedException` si el test no lo usa (patrón heredado de las Stories 2.2/2.3).
  - [ ] `dotnet test tests/SiesaAgents.UnitTests` → todos verdes (mínimo 15 nuevos + 73 heredados de Story 2.3).

- [ ] **Task 6 — Backend API: endpoint `PUT /api/v1/clientes/{id:guid}` + DI wiring** (AC: #4, #5, #6, #9)
  - [ ] Editar `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — añadir dentro del `group.MapGroup("/api/v1/clientes")` (después del `MapPost("/", ...)` de Story 2.3):
    ```csharp
    // Story 2.4 — Update cliente. 200 on success, 400 on validation, 404 when
    // the id does not exist, 409 on uk_clientes_nit conflict against a DIFFERENT
    // cliente row.
    group.MapPut("/{id:guid}", async (
        Guid id,
        UpdateClienteRequest request,
        IValidator<UpdateClienteRequest> validator,
        UpdateClienteCommandHandler handler,
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
            var command = new UpdateClienteCommand(
                id,
                request.Nombre,
                request.Nit,
                request.Telefono,
                request.Ciudad);

            var dto = await handler.HandleAsync(command, ct);

            return Results.Ok(dto);
        }
        catch (ClienteNotFoundException)
        {
            return Results.Problem(
                title: "Cliente no encontrado",
                detail: $"No existe ningún cliente con id {id}.",
                statusCode: StatusCodes.Status404NotFound,
                type: "https://tools.ietf.org/html/rfc9110#section-15.5.5",
                instance: http.Request.Path);
        }
        catch (DuplicateNitException)
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
    .WithName("UpdateCliente");
    ```
  - [ ] Editar `backend/src/SiesaAgents.API/Program.cs` — registrar en DI (junto a los otros `AddScoped` de Stories 2.1/2.2/2.3, antes de `builder.Build()`):
    ```csharp
    // Story 2.4 — edit-client wiring.
    builder.Services.AddScoped<UpdateClienteCommandHandler>();
    builder.Services.AddScoped<IValidator<UpdateClienteRequest>, UpdateClienteRequestValidator>();
    ```
  - [ ] Añadir los `using` correspondientes en `Program.cs` si faltan: `using SiesaAgents.Application.Clientes.Commands;` (ya existe), `using SiesaAgents.Application.Clientes.DTOs;` (ya existe), `using SiesaAgents.Application.Clientes.Validators;` (ya existe).
  - [ ] Verificar contra Scalar (`http://localhost:5000/scalar`) que `UpdateCliente` aparece con 4 respuestas documentadas (200/400/404/409).
  - [ ] `dotnet build src/SiesaAgents.API` → 0 errores; ningún warning "unused using".

- [ ] **Task 7 — Backend Integration Tests: `PUT /api/v1/clientes/{id}`** (AC: #4, #5, #6, #9, #10)
  - [ ] Extender `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` con:
    - `UpdateCliente_ExistingId_ValidPayload_Returns200WithUpdatedDto()` — seed 1 cliente, PUT `/api/v1/clientes/{id}` con nuevos valores, asserta:
      * `StatusCode == 200`;
      * body camelCase JSON con `id` intacto, `nombre/nit/telefono/ciudad` con los nuevos valores;
      * `createdAt` **igual** al original (audit — no cambia);
      * `updatedAt` **mayor** que el original;
      * Segunda petición GET al mismo id → 200 con el mismo DTO actualizado (round-trip verified).
    - `UpdateCliente_UnknownId_Returns404ProblemDetails()` — PUT `/api/v1/clientes/{Guid.NewGuid()}` (id que no existe) → status 404, `Content-Type: application/problem+json`, body con `"title":"Cliente no encontrado"`, `"status":404`; **NO** contiene `System.` ni `.cs:line` (NFR6).
    - `UpdateCliente_InvalidGuid_Returns400()` — PUT `/api/v1/clientes/not-a-guid` → status 400 (route constraint `{id:guid}`); asserta que respuesta es Problem Details y no contiene stack trace (NFR6).
    - `UpdateCliente_EmptyNombre_Returns400ProblemDetails()` — seed 1 cliente, PUT con `nombre = ""` → 400, body con `"errors": { "nombre": ["El nombre es requerido."] }`. NO contiene stack traces.
    - `UpdateCliente_WhitespaceOnlyFields_Returns400WithAllFieldErrors()` — los 4 campos con espacios → 4 keys en `errors`.
    - `UpdateCliente_NitExceedsMaxLength_Returns400()` — NIT de 51 chars → 400 con mensaje MaxLength.
    - `UpdateCliente_SameNit_NoConflict_Returns200()` — seed 1 cliente con `nit = "900123456-7"`, PUT al mismo cliente reenviando el mismo NIT (solo cambia teléfono/ciudad) → 200 (NO 409). Este test **es crítico** para AC#5 corolario — el índice único no se viola porque la fila que sostiene el NIT es la misma.
    - `UpdateCliente_DuplicateNit_Returns409ProblemDetails()` — seed 2 clientes A (`nit = "111"`) y B (`nit = "222"`), PUT sobre A con `nit = "222"` → 409, body contiene `"title":"NIT/RUC duplicado"`, `"status":409`, `"field":"nit"` (top-level, no `extensions`); NO contiene `.cs:line`, `System.`, `Microsoft.EntityFrameworkCore`, `Npgsql` (NFR6).
    - `UpdateCliente_DuplicateNit_DoesNotPersist()` — post-condition: después del 409, GET del cliente A retorna aún `nit = "111"` (rollback implícito de EF Core en `SaveChangesAsync` fallido).
    - `UpdateCliente_TrimsFieldsBeforePersist()` — PUT `{ "nombre": "  Acme Updated  ", ... }` → GET retorna `"nombre": "Acme Updated"` (defensa server-side por `ClienteEntity.Update`).
    - `UpdateCliente_PreservesCreatedAt()` — seed cliente con `createdAt = X`, PUT → GET → asserta `createdAt` sigue siendo `X` (P1#10 test-design "PUT /clientes/{id} updates only mutable fields; created_at unchanged").
  - [ ] **Nota sobre 409 en EF Core InMemory**: Story 2.3 ya documentó que EF Core InMemory 10 NO enforcea unique indexes en `SaveChangesAsync`. Los 2 tests de 409 (`UpdateCliente_DuplicateNit_*`) deben ser marcados `[Trait("Category","Integration")]` y correrse sólo con Postgres real; alternativamente, mockear la excepción en el handler-level (Task 5) sin subir por HTTP. Documentar el skip inline con nota `// EF Core InMemory limitation — Story 2.3 same issue; validated via unit test on handler`.
  - [ ] Ejecutar `dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ClienteEndpointsTests` → verdes (excepto los 2 marcados como InMemory-skip, si aplica).

- [ ] **Task 8 — Frontend Domain + Infrastructure: `update` en el repositorio** (AC: #4, #5, #9)
  - [ ] Editar `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — extender:
    ```ts
    /**
     * Payload accepted by PUT /api/v1/clientes/{id}. Same shape as
     * CreateClientePayload (no id, createdAt, updatedAt — those are server-
     * managed). Kept as its own type so future divergence (e.g. partial
     * updates) doesn't force a Create/Update rename cascade.
     */
    export type UpdateClientePayload = {
      readonly nombre: string
      readonly nit: string
      readonly telefono: string
      readonly ciudad: string
    }

    export interface IClienteRepository {
      getAll(signal?: AbortSignal): Promise<Cliente[]>
      getById(id: string, signal?: AbortSignal): Promise<Cliente>
      create(payload: CreateClientePayload, signal?: AbortSignal): Promise<Cliente>
      /**
       * PUT /api/v1/clientes/{id} → 200 OK returning the freshly persisted
       * Cliente. Rejects with an AxiosError when the server responds 4xx/5xx
       * (React Query surfaces the error; callers inspect `error.response?.status`
       * — 404 signals not-found, 409 signals a duplicate NIT).
       */
      update(id: string, payload: UpdateClientePayload, signal?: AbortSignal): Promise<Cliente>
    }
    ```
  - [ ] Editar `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — añadir `update`:
    ```ts
    async update(id, payload, signal) {
      // Non-2xx surfaces as AxiosError so useUpdateCliente can branch on
      // error.response?.status. `encodeURIComponent(id)` is defence-in-depth
      // for path injection (backend also has route constraint `{id:guid}`).
      const { data } = await apiClient.put<Cliente>(
        `/api/v1/clientes/${encodeURIComponent(id)}`,
        payload,
        { signal },
      )
      return data
    },
    ```
  - [ ] Añadir `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.update.test.ts` (patrón heredado de `clienteApiRepository.create.test.ts` y `.getById.test.ts`):
    - Happy path: MSW PUT → 200 con DTO actualizado → `update` retorna el DTO.
    - 400: MSW → AxiosError con `response.status === 400`.
    - 404: MSW → AxiosError con `response.status === 404` y body Problem Details.
    - 409: MSW → AxiosError con `response.status === 409` y body con `{ title, field: 'nit' }` al top-level.
    - 500: MSW → AxiosError con `response.status === 500`.

- [ ] **Task 9 — Frontend Application: `useUpdateCliente` (TanStack Query mutation)** (AC: #4, #5, #6, #7)
  - [ ] Crear `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`:
    ```ts
    import { useMutation, useQueryClient } from '@tanstack/react-query'
    import type { AxiosError } from 'axios'
    import { toast } from 'siesa-ui-kit'
    import type { Cliente } from '../domain/Cliente'
    import type { UpdateClientePayload } from '../domain/IClienteRepository'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

    /**
     * Same Problem Details shape as CreateClienteError — the server flattens
     * the `extensions` bag into the response root (ASP.NET Results.Problem
     * behaviour), so `field` lives at the top level. Only the fields the
     * frontend actually reads are typed (NFR6 — never dump raw server strings).
     */
    interface DuplicateNitProblem {
      readonly title?: string
      readonly field?: string
    }

    export type UpdateClienteError = AxiosError<DuplicateNitProblem>

    /**
     * Mutation for PUT /api/v1/clientes/{id}.
     *
     * Success:
     *   1. Replace the cliente entry in the ['clientes'] cache in-place (order
     *      preserved — do NOT reinsert at head, unlike Create).
     *   2. Replace the cache for ['clientes', id] so ClienteDetailView reflects
     *      the change without a round trip.
     *   3. Invalidate both keys so any stale consumers reconcile.
     *   4. Toast success (Spanish, green, bottom-right, 3s).
     *
     * Error:
     *   • 409 → the caller (form component) handles it inline on the NIT field.
     *     No toast (business validation).
     *   • 404 → invalidate ['clientes'] so the ghost row disappears from the
     *     list, then a generic red toast (the modal-level UX decides whether
     *     to close).
     *   • Anything else → generic red toast "No se pudo guardar. Intenta de
     *     nuevo." (5s).
     */
    export function useUpdateCliente(clienteId: string) {
      const queryClient = useQueryClient()

      return useMutation<Cliente, UpdateClienteError, UpdateClientePayload>({
        mutationFn: (payload) => clienteApiRepository.update(clienteId, payload),
        onSuccess: (updated) => {
          queryClient.setQueryData<Cliente[]>(['clientes'], (prev) =>
            prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev,
          )
          queryClient.setQueryData<Cliente>(['clientes', updated.id], updated)
          queryClient.invalidateQueries({ queryKey: ['clientes'] })
          queryClient.invalidateQueries({ queryKey: ['clientes', updated.id] })
          toast.success('Cliente actualizado correctamente', {
            position: 'bottom-right',
            duration: 3000,
            color: 'green',
          })
        },
        onError: (error) => {
          const status = error.response?.status
          if (status === 409) {
            // Surfaced to the form as an inline NIT error — no toast.
            return
          }
          if (status === 404) {
            // Row disappeared under us — refresh the list so it does not stay
            // in stale state; the caller may also want to close the modal.
            queryClient.invalidateQueries({ queryKey: ['clientes'] })
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
  - [ ] Crear `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.tsx`:
    - `renderHook` con `QueryClientProvider` wrapper + `ToastProvider`.
    - **Happy path (200)**: MSW responde 200 con DTO actualizado → asserta (a) `data` es el DTO actualizado, (b) `queryClient.getQueryData(['clientes'])` refleja el nuevo cliente en la misma posición (no cambia el orden), (c) `queryClient.getQueryData(['clientes', id])` es el DTO actualizado, (d) `toast.success` invocado 1 vez con `"Cliente actualizado correctamente"`.
    - **409 path**: MSW responde `{ title: 'NIT/RUC duplicado', status: 409, field: 'nit' }, { status: 409 }` → asserta `result.current.isError && result.current.error.response?.status === 409` **y** que **NO** se disparó `toast.error` (spy con 0 llamadas).
    - **404 path**: MSW responde 404 → asserta `isError`; `toast.error` invocado 1 vez con `"No se pudo guardar. Intenta de nuevo."`; `queryClient.invalidateQueries` invocado con `{ queryKey: ['clientes'] }` (spy).
    - **500 path**: MSW responde 500 → asserta `isError` + `toast.error` invocado 1 vez.
    - **Cache invalidation**: spy sobre `queryClient.invalidateQueries` — invocado con `['clientes']` y con `['clientes', id]` en el path exitoso (P0#7 mitigación).
    - **Order preserved**: si seed tiene [A, B, C] y updateamos B → `getQueryData(['clientes'])` retorna [A, B', C] (B' en la misma posición, no re-ordenado al head).

- [ ] **Task 10 — Frontend Presentation: extender `ClienteFormModal` con modo `edit`** (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [ ] Editar `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.tsx` para soportar `mode: 'create' | 'edit'`:
    ```tsx
    // Nueva props type — la firma existente se convierte en discriminated union.
    // El mode determina qué mutación se usa, qué defaultValues se cargan, y qué
    // título/toast se muestra. `clienteId` sólo es requerido en edit mode.
    export type ClienteFormModalProps =
      | {
          mode?: 'create'
          isOpen: boolean
          onClose: () => void
        }
      | {
          mode: 'edit'
          isOpen: boolean
          onClose: () => void
          clienteId: string
          initialValues: ClienteFormValues
        }
    ```
    Implementación (patch al componente existente):
    ```tsx
    export function ClienteFormModal(props: ClienteFormModalProps) {
      const { isOpen, onClose } = props
      const mode = props.mode ?? 'create'
      const isEdit = mode === 'edit'

      // Only edit mode needs a clienteId + initialValues.
      const initialValues: ClienteFormValues = isEdit
        ? props.initialValues
        : { nombre: '', nit: '', telefono: '', ciudad: '' }

      const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setError,
        setFocus,
      } = useForm<ClienteFormValues>({
        resolver: zodResolver(clienteFormSchema),
        mode: 'onBlur',
        // In edit mode, defaultValues change when the user selects a different
        // cliente. RHF only reads defaultValues on initial mount, so we ALSO
        // call reset(initialValues) inside the useEffect below whenever the
        // modal opens — that keeps the form in sync with props.
        defaultValues: initialValues,
      })

      const createMutation = useCreateCliente()
      const updateMutation = useUpdateCliente(isEdit ? props.clienteId : '')
      const activeMutation = isEdit ? updateMutation : createMutation

      useEffect(() => {
        if (isOpen) {
          reset(initialValues)
          const t = window.setTimeout(() => setFocus('nombre'), 0)
          return () => window.clearTimeout(t)
        }
        // On close we also reset to initialValues so reopening the modal
        // (edit mode: same cliente; create mode: empty) starts clean.
        reset(initialValues)
        activeMutation.reset()
        return undefined
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [isOpen, isEdit ? props.clienteId : null])

      const onSubmit = handleSubmit(async (values) => {
        try {
          await activeMutation.mutateAsync(values)
          onClose()
        } catch (error) {
          // 409 → inline NIT error (both create + edit share the same copy).
          // Any other error was already toasted by the mutation hook. We do
          // NOT close the modal so the user can retry.
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

      if (!isOpen) {
        return null
      }

      const title = isEdit ? 'Editar cliente' : 'Nuevo cliente'
      // (formNode y actions permanecen iguales que en Story 2.3 — la única
      //  diferencia visible es el título del AlertDialog.)
      // ...
      return (
        <AlertDialog
          isOpen={isOpen}
          title={title}
          ...
        />
      )
    }
    ```
  - [ ] La `title` prop se resuelve dinámicamente: `"Nuevo cliente"` en create, `"Editar cliente"` en edit.
  - [ ] Actualizar tests existentes de `ClienteFormModal.test.tsx` (Story 2.3) para asegurar que sin la prop `mode` el modal se comporta como antes (backward compatible) — el default `mode = 'create'` preserva el comportamiento.
  - [ ] Añadir `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.edit.test.tsx` (o extender `ClienteFormModal.test.tsx`):
    - `renders with title "Editar cliente" and pre-filled fields when mode="edit"` — pasa `initialValues={{ nombre: 'X', nit: 'Y', telefono: 'Z', ciudad: 'W' }}` → asserta `data-testid="cliente-form-nombre"` tiene `value="X"`, etc.; asserta título `"Editar cliente"` visible en DOM.
    - `submits update with edited values → invokes useUpdateCliente`; MSW responde 200 con dto actualizado → modal se cierra + toast `"Cliente actualizado correctamente"`.
    - `shows inline error on empty required field` — abre en edit, borra `Nombre`, click Guardar → asserta mensaje inline + **cero requests PUT** (MSW counter).
    - `on 409 duplicate NIT → inline NIT error, modal stays open, no toast` — mismo assert que 2.3 pero para el flow update.
    - `on 404 unknown id → toast red, modal stays open` — MSW responde 404 → asserta `toast.error` invocado y modal sigue montado.
    - `on cancel → closes without submit and preserves original values` — abre modal, cambia `Nombre` a `"Modified"`, click Cancelar → asserta modal cerrado; abre modal de nuevo → `data-testid="cliente-form-nombre"` tiene el valor **original** (no `"Modified"`).
    - `switching clienteId while modal closed loads new initialValues` — renderiza con `clienteId="A"` + `initialValues=A`, cierra, cambia props a `clienteId="B"` + `initialValues=B`, abre → asserta inputs con datos de B.
    - **NFR6 defense**: MSW 409 responde con `detail: "SELECT * FROM users; DROP TABLE clientes"` → asserta que ese string **NO** aparece en el DOM.

- [ ] **Task 11 — Frontend Presentation: cablear "Editar" en `ClienteDetailView`** (AC: #1)
  - [ ] Editar `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
    - Añadir `import { useState } from 'react'`, `import { Button } from 'siesa-ui-kit'`, `import { ClienteFormModal } from './ClienteFormModal'`.
    - Opcionalmente `import { PencilSquareIcon } from '@heroicons/react/24/outline'`.
    - Añadir estado local: `const [isEditOpen, setIsEditOpen] = useState(false)`.
    - Renderizar el botón `"Editar"` dentro del bloque `<div className="flex flex-col gap-6 p-6">` — específicamente al lado del `<h2 id="cliente-detail-title">`, envolviéndolos en un flex container:
      ```tsx
      <div className="flex items-start justify-between gap-4">
        <h2
          id="cliente-detail-title"
          className="text-xl font-bold text-slate-900"
        >
          {cliente.nombre}
        </h2>
        <Button
          htmlType="button"
          type="outline"
          onClick={() => setIsEditOpen(true)}
          data-testid="cliente-editar-button"
          aria-label="Editar cliente"
        >
          Editar
        </Button>
      </div>
      ```
    - Renderizar el modal al final del componente, en el mismo nivel que el `<section>` root (para no ser recortado por su `overflow`):
      ```tsx
      return (
        <>
          <section data-testid="cliente-detail-panel" ... >
            ...
          </section>
          <ClienteFormModal
            mode="edit"
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            clienteId={cliente.id}
            initialValues={{
              nombre: cliente.nombre,
              nit: cliente.nit,
              telefono: cliente.telefono,
              ciudad: cliente.ciudad,
            }}
          />
        </>
      )
      ```
      (Cambiar el `return <section>...</section>` al fragment `<>...</>`.)
    - El botón `"Editar"` **no** se renderiza en las ramas `isLoading`, `isError`, `!cliente` — sólo en el happy path donde `cliente` está cargado (patrón heredado de las guardas `if (isLoading)` / `if (isError)` / `if (!cliente)`).
  - [ ] Actualizar `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`:
    - Añadir test: `[TC-Story-2.4-Editar-Button-Visible]` — cliente cargado → asserta `data-testid="cliente-editar-button"` presente + `aria-label="Editar cliente"`.
    - Añadir test: `[TC-Story-2.4-Editar-Button-Hidden-When-Loading]` — MSW retrasa response → mientras `isLoading`, el botón NO está en DOM (asserta con `queryByTestId`).
    - Añadir test: `[TC-Story-2.4-Editar-Button-Hidden-On-404]` — MSW retorna 404 → renderiza `NotFoundClientePanel`, botón NO presente.
    - Añadir test: `[TC-Story-2.4-Opens-Modal-With-Prefilled-Fields]` — click en `cliente-editar-button` → asserta modal montado (`cliente-form-modal` en DOM), asserta que `cliente-form-nombre` tiene el `value` correcto (== `cliente.nombre`), asserta título `"Editar cliente"` visible.
    - Los tests heredados de Story 2.2 **deben seguir verdes** (skeleton, error panel, not-found panel, mobile hide) — verificar que el `<>` fragment no rompe queries por `role="region"`.

- [ ] **Task 12 — Frontend Presentation: exportar `useUpdateCliente` desde el barrel** (AC: #4)
  - [ ] Editar `frontend/src/modules/crm/clientes/index.ts` — añadir:
    ```ts
    export { useUpdateCliente } from './application/useUpdateCliente'
    ```
    (`ClienteFormModal` ya está exportado desde Story 2.3.)

- [ ] **Task 13 — Frontend MSW: handler PUT `/api/v1/clientes/:id`** (AC: #4, #5, #6, #7, #10)
  - [ ] Editar `frontend/src/test/msw/handlers.ts` — añadir el PUT handler que muta `currentClientes` y respeta 404/409/happy path:
    ```ts
    http.put('*/api/v1/clientes/:id', async ({ params, request }) => {
      const id = String(params.id)
      const body = (await request.json()) as {
        nombre?: string
        nit?: string
        telefono?: string
        ciudad?: string
      }

      const existing = currentClientes.find((c) => c.id === id)
      if (!existing) {
        return HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5',
            title: 'Cliente no encontrado',
            status: 404,
            detail: `No existe ningún cliente con id ${id}.`,
            instance: `/api/v1/clientes/${id}`,
          },
          { status: 404 },
        )
      }

      // Duplicate NIT: only conflicts against a DIFFERENT cliente row.
      // Same NIT on the same row is allowed (matches uk_clientes_nit + Postgres
      // ON CONFLICT semantics — the row that "owns" the value is the one being
      // updated, so no violation).
      if (
        body.nit &&
        currentClientes.some((c) => c.id !== id && c.nit === body.nit)
      ) {
        return HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc9110#section-15.5.10',
            title: 'NIT/RUC duplicado',
            status: 409,
            detail: 'Ya existe un cliente con el NIT/RUC indicado.',
            instance: `/api/v1/clientes/${id}`,
            field: 'nit',
          },
          { status: 409 },
        )
      }

      const now = new Date().toISOString()
      const updated: Cliente = {
        ...existing,
        nombre: (body.nombre ?? existing.nombre).trim(),
        nit: (body.nit ?? existing.nit).trim(),
        telefono: (body.telefono ?? existing.telefono).trim(),
        ciudad: (body.ciudad ?? existing.ciudad).trim(),
        // createdAt is IMMUTABLE audit — never overwritten (matches backend).
        createdAt: existing.createdAt,
        updatedAt: now,
      }
      currentClientes = currentClientes.map((c) => (c.id === id ? updated : c))
      return HttpResponse.json(updated, { status: 200 })
    }),
    ```
  - [ ] `resetClienteState()` (existente desde Story 2.3) sigue siendo suficiente — el handler PUT modifica `currentClientes` que el reset ya restaura.

- [ ] **Task 14 — Frontend integration test: end-to-end de edición** (AC: #1, #4, #5, #8)
  - [ ] Crear `frontend/src/routes/clientes.edit.integration.test.tsx` (patrón heredado de `clientes.detail.integration.test.tsx` y `clientes.create.integration.test.tsx`):
    - Monta el árbol de rutas con `createMemoryHistory({ initialEntries: ['/clientes/11111111-1111-1111-1111-111111111111'] })` + `createRouter` + `<RouterProvider />` + `<QueryProvider>` + `<ToastProvider>`.
    - Test 1 (happy path edit):
      * espera a que `ClienteDetailView` cargue el cliente A (`Acme Corp`);
      * click en `data-testid="cliente-editar-button"`;
      * asserta modal con título `"Editar cliente"` visible y campos pre-llenados (`cliente-form-nombre` value `"Acme Corp"`, `cliente-form-nit` value `"900123456-7"`, etc.);
      * cambia `Nombre` a `"Acme Updated"`;
      * click `"Guardar"`;
      * asserta modal cerrado, toast `"Cliente actualizado correctamente"` visible;
      * asserta que el `<h2 id="cliente-detail-title">` del detalle ahora muestra `"Acme Updated"`;
      * asserta que el `ClientListItem` en la lista lateral (`data-testid="clientes-list"`) para el mismo id muestra `"Acme Updated"` en la posición original (no reordenado).
    - Test 2 (409 flow):
      * navega a `/clientes/{A.id}`, click Editar, cambia NIT a `"800987654-3"` (NIT del cliente B en seed);
      * click Guardar → asserta modal sigue montado;
      * `data-testid="cliente-form-nit-error"` contiene `"El NIT/RUC ya está registrado"` exacto;
      * el string `"Ya existe un cliente"` **NO** aparece en el DOM (NFR6 audit);
      * la lista/detalle NO cambiaron.
    - Test 3 (cancel preserves original):
      * abre modal edit, cambia `Nombre` a `"Modified"`, click Cancelar;
      * asserta modal cerrado y el detalle todavía muestra `"Acme Corp"` (valor original);
      * reabre modal → asserta que `cliente-form-nombre` tiene valor `"Acme Corp"` de nuevo (no residuo del edit anterior).
    - Test 4 (empty field validation):
      * abre modal edit, borra completamente el campo `Nombre`, click Guardar;
      * asserta 4 asserts: (a) `cliente-form-nombre-error` presente con `"El nombre es requerido"`, (b) modal sigue abierto, (c) MSW request counter para PUT = 0 (sin llamada al backend), (d) detalle sigue mostrando `"Acme Corp"` (sin cambios).

- [ ] **Task 15 — Frontend integration test: cache invalidation E2E** (AC: #4)
  - [ ] Añadir un test dentro de `clientes.edit.integration.test.tsx` que:
    - Espera lista cargada con 3 clientes;
    - Edita el cliente B → completa → asserta que el `useClientes()` de la lista se refresca (queryClient spy) y muestra el nombre nuevo en la posición #2 (no #1);
    - Asserta que si se navega a `/clientes/{B.id}` de nuevo (o simplemente sigue en el detalle), el cache `['clientes', B.id]` sirve inmediatamente los datos nuevos sin refetch adicional (`useCliente` retorna `isFetching=false` con los datos actualizados).

- [ ] **Task 16 — Verificación end-to-end** (AC: #10)
  - [ ] `pnpm --filter frontend build` → 0 errores TypeScript (`tsc -b` limpio); `routeTree.gen.ts` sin cambios (Story 2.4 no añade rutas — sólo un modal reutilizado).
  - [ ] `pnpm --filter frontend lint` → 0 errores nuevos (respetar los 5 warnings pre-existentes documentados por Story 2.3).
  - [ ] `pnpm --filter frontend test` → todos los tests verdes (heredados + los nuevos de esta historia).
  - [ ] `dotnet build backend/SiesaAgents.sln` → 0 errores.
  - [ ] `dotnet test backend/SiesaAgents.sln` → todos los tests verdes (excepto los InMemory-skips documentados en Story 2.3 y en Task 7).
  - [ ] Manual sanity (si hay backend + Postgres disponibles):
    - Visitar `http://localhost:5173/clientes/{id existente}` → click `"Editar"` → modal abierto con datos pre-llenados.
    - Editar `Nombre` → click `"Guardar"` → modal cierra, toast verde `"Cliente actualizado correctamente"`, el detalle y la lista lateral muestran el nombre nuevo (en la misma posición).
    - Editar dejando `Nombre` vacío → mensaje inline `"El nombre es requerido"`; **cero** requests PUT en Network DevTools.
    - Editar cambiando `NIT/RUC` al valor de OTRO cliente existente → modal permanece con mensaje inline `"El NIT/RUC ya está registrado"` bajo el campo NIT; no cambia el detalle ni la lista.
    - Editar sin cambiar el NIT (solo teléfono/ciudad) → 200 OK, cliente actualizado (sin 409).
    - Editar y hacer click en `"Cancelar"` (o Esc, o ✕) → modal cierra, el detalle sigue con datos originales; reabrir el modal muestra valores originales.
    - Detener backend → intentar editar → toast rojo `"No se pudo guardar. Intenta de nuevo."`; modal sigue abierto con los valores editados.
    - Verificar en Scalar (`/scalar`) que `UpdateCliente` documenta 200/400/404/409.

## Dev Notes

### Story 2.3 handoff (relevante para esta historia)

- **`ClienteFormModal.tsx` (Story 2.3) es reutilizable** con una extensión de props para modo `"edit"` — evita duplicar el JSX de los 4 campos + validación + a11y. La extensión es un discriminated union en `ClienteFormModalProps` que hace `clienteId` e `initialValues` obligatorios solo cuando `mode: 'edit'`. **NO** crear un `ClienteEditModal.tsx` separado — el DRY del componente es explícito en el patrón (UX spec — Modal & Overlay Patterns: mismo shell, títulos y acciones distintos).
- **`useCreateCliente` (Story 2.3)** ya invalida `['clientes']` — replicar el mismo patrón en `useUpdateCliente` para AC#4 (FR27, R-004 mitigation).
- **`ClienteEntity.Create` (Story 2.1)** ya realiza `.Trim()` + `NotEmpty` en los 4 campos. `ClienteEntity.Update` (Task 1) replica esa validación de dominio como guardián final, con el requisito extra de refrescar `UpdatedAt` y preservar `Id`/`CreatedAt`.
- **`DuplicateNitException` (Story 2.3)** se reutiliza tal cual — no crear una excepción `DuplicateNitOnUpdateException`. La política 409 es la misma en Create y Update, y el `IsUniqueNitViolation` helper puede refactorizarse a un método estático compartido en `SiesaAgents.Application.Clientes.Infrastructure` si empieza a duplicarse — para esta historia, se copia inline en el nuevo handler (misma justificación que el existing `CreateClienteCommandHandler`).
- **Índice único `uk_clientes_nit`** (Story 2.1 migración `20260702091701_AddClientesTable`) — sigue funcionando idéntico para Update; el matching se hace por `nit + id != current_id`.
- **`apiClient` (Axios singleton)** — usar `apiClient.put(url, payload, { signal })`. Los interceptors + `baseURL` desde `VITE_API_URL` ya están wired desde Epic 1. No inventar cancelación manual.
- **`MSW server`** en `frontend/src/test/setup.ts` (Story 2.1) con `beforeAll(server.listen)` + `afterEach(server.resetHandlers)` + `afterEach(resetClienteState)` (Story 2.3). Task 13 añade el handler PUT reutilizando `currentClientes` mutable + `resetClienteState()`.
- **`ToastProvider`** ya está wired en `main.tsx` desde Story 2.3 (`<QueryProvider><ToastProvider><RouterProvider/>`). Tests que asertan toasts pueden usar `vi.mock('siesa-ui-kit', ...)` como en Story 2.3.
- **`ClienteDetailView.tsx` (Story 2.2)** — el header actual (líneas ~76-83) ya tiene el `<h2 id="cliente-detail-title">`. Task 11 lo envuelve en un `flex justify-between` para añadir el botón `"Editar"` a la derecha. El botón NO se muestra en `isLoading`, `isError` (404 o red-error), ni cuando `!cliente` (rama defensiva).
- **Route `/clientes/$clienteId`** — Task 11 no toca la route file, solo el componente `ClienteDetailView` renderizado dentro. No hay nueva ruta ni cambio en `routeTree.gen.ts`.

### Story 1.3 handoff (backend)

- `AppDbContext.Clientes` y `ClienteConfiguration` (Story 2.1) ya declaran `uk_clientes_nit` como unique index. `SaveChangesAsync` con violación durante Update producirá `DbUpdateException { InnerException: PostgresException { SqlState: "23505", ConstraintName: "uk_clientes_nit" } }` — misma semántica que Create (Story 2.3).
- `ExceptionHandlingMiddleware` sigue siendo la red de seguridad → 500 Problem Details sin stack trace (NFR6). Task 4 asegura que **sólo** las 23505 se traducen a 409 y **sólo** los `null` de `GetByIdAsync` se traducen a 404 — cualquier otra excepción **debe propagarse** al middleware.
- `AddProblemDetails()` + `UseStatusCodePages()` ya están en `Program.cs` — `Results.ValidationProblem(...)` y `Results.Problem(...)` producen `application/problem+json` correctamente.
- **EF Core tracking**: `GetByIdAsync` (Story 2.2) usa `AsNoTracking` (read-only). Para Update, `ClienteRepository.UpdateAsync` re-adjunta la entidad como `Modified` via `_db.Clientes.Update(entity)` — es la implementación más simple y auditablemente correcta. Alternativa considerada y rechazada: cambiar `GetByIdAsync` a tracked queries — rompería el contrato read-only del método y afectaría performance del detalle (Story 2.2).

### Alignment with company standards

**Clean Architecture + DDD (mandatory):**
- Frontend: `modules/crm/clientes/{domain, application, infrastructure, presentation}` — nuevo `update` en repositorio (infrastructure), nuevo hook `useUpdateCliente` en application, extensión del `ClienteFormModal` en presentation. **NO** se importa desde otros módulos hermanos; sólo desde `shared/` (per `.claude/agent-memory/sa-quick-dev/company-standards.md`).
- Backend: `SiesaAgents.Domain` (nueva excepción `ClienteNotFoundException` + método instancia `ClienteEntity.Update` + `UpdateAsync` en interface) → `SiesaAgents.Application` (Command + Handler + Validator + DTO) → `SiesaAgents.Infrastructure` (impl de `UpdateAsync`) → `SiesaAgents.API` (endpoint + DI wiring). **Repositorio infrastructure NO captura excepciones** — la política de traducción (23505 → `DuplicateNitException`, `null` de fetch → `ClienteNotFoundException`) vive en el handler de Application, no en el repositorio.

**Stack (locked):**
- Frontend: React 19, Vite 8, TS 6, TanStack Query 5 (`useMutation` con `setQueryData` map-in-place + `invalidateQueries`), TanStack Router 1, Zustand 5 (no requerido — el estado del modal es `useState` local en `ClienteDetailView`), Tailwind v4, siesa-ui-kit `^1.0.255` (`AlertDialog`, `Button`, `Input`, `Toast`, `ToastProvider`, `toast`), Zod 4 (schema **reutilizado**), React Hook Form 7, `@hookform/resolvers`. No requiere nuevas deps.
- Backend: .NET 10, Minimal API, EF Core 10, FluentValidation (ya referenciado), Npgsql 10 (ya en `SiesaAgents.Application.csproj` desde Story 2.3), xUnit, `Microsoft.AspNetCore.Mvc.Testing` + EF Core InMemory para tests sin Docker.

**Convenciones críticas:**
- **PKs**: `Guid` en backend, `string` (UUID serializado) en frontend — Update NO cambia el `Id`.
- **DateTime**: `DateTimeOffset` en backend, `string` (ISO 8601) en frontend — `UpdatedAt` refrescado por el dominio; `CreatedAt` **inmutable** (invariante testado en Task 5 y Task 7).
- **Snake_case en DB** via `ApplySnakeCaseNaming()` — la tabla `clientes` ya existe.
- **Problem Details RFC 7807** para todos los errores — 400/404/409/500. La forma exacta del body 409 (con `field` **flat al top-level** vía `extensions:`) ya fue verificada empíricamente en Story 2.3; el frontend `DuplicateNitProblem` type ya lo asume.
- **Scalar** para docs — Swagger prohibido.
- **Texto UI 100% en español (es-CO); código 100% en inglés** — labels/textos nuevos: `"Editar cliente"` (título modal), `"Editar"` (botón detalle), `"Editar cliente"` (aria-label), `"Cliente actualizado correctamente"` (toast success), y los mismos strings de validación/error de Story 2.3 (`"El nombre es requerido"`, `"El NIT/RUC ya está registrado"`, `"No se pudo guardar. Intenta de nuevo."`, `"Guardando..."`, `"* Campos obligatorios"`). Identificadores/tests/types en inglés.
- **WCAG 2.1 AA** — el botón `"Editar"` tiene `aria-label="Editar cliente"` (por si el texto no fuera lo suficientemente descriptivo en pantalla con contexto). Los mismos ARIA attributes de Story 2.3 en el form (`aria-required`, `aria-invalid`, `aria-describedby`, `role="alert"`) siguen aplicando. AlertDialog + HeadlessUI/Radix mantienen focus-trap + Esc-to-close.
- **Bundle < 500KB gzipped** — no nuevas deps.
- **Package manager**: `pnpm` (respetar lockfile).

**Component hierarchy of decision (obligatoria, per UX spec):**
1. **siesa-ui-kit primero** — `Button` (`type="outline"` para "Editar"; `type="default"` para "Guardar"), `Input` (reutilizado — sin cambios), `AlertDialog` (reutilizado — solo cambia `title`), `Toast` + `toast` (reutilizado).
2. **shadcn/Radix segundo** — no requerido.
3. **Custom composition tercero** — `ClienteFormModal` (extensión), sub-componente `Field` (heredado de Story 2.3, sin cambios).

**MasterCrud (per mastercrud-use-reference.md):**
- **NO se usa en esta historia** — misma justificación que Story 2.3. El formulario modal + split panel es composición custom (siesa-ui-kit primitives + Tailwind + Heroicons), no una tabla CRUD. Documentado sin implementar.

### Contexto de Story previa (Story 2.3)

Learnings extraídos de `Completion Notes` de Story 2.3 que aplican aquí:

- **AlertDialog children slot**: siesa-ui-kit `AlertDialog` ignora `children` — usar `description={formNode}` para inyectar el form. Story 2.4 hereda esto tal cual (Task 10 reutiliza el `formNode` existente).
- **Button prop naming**: `type` es la variante visual (`default | outline | plain`); `htmlType` es el HTML behavior (`button | submit | reset`). NO usar `variant=` — no existe en el kit. Aplicable al botón `"Editar"` de Task 11 (`type="outline"`, `htmlType="button"`) y al submit del form (`type="default"`, `htmlType="submit"`).
- **`useEffect` deps** en `ClienteFormModal`: depender solo de `isOpen` (más `clienteId` en el nuevo modo edit para reset cuando cambia el cliente activo) — NO listar el objeto de mutación completo (nueva instancia por render → OOM en vitest). Task 10 lo maneja con `[isOpen, isEdit ? props.clienteId : null]` + `// eslint-disable-next-line react-hooks/exhaustive-deps`.
- **`Problem Details` en 409 flat**: `field` va al top-level, NO bajo `extensions.field` — verificado empíricamente en Story 2.3 (`Results.Problem(extensions: ...)` de ASP.NET aplana). Task 9 asume el mismo shape (`DuplicateNitProblem`).
- **`vi.mock('siesa-ui-kit', ...)`** para spy sobre `toast.success` / `toast.error` — patrón heredado de Story 2.3.
- **`server.use(...)` per-test** para 404/409/500 — patrón heredado.
- **`crypto.randomUUID()`** disponible en Node ≥ 18.
- **Route file naming**: `routeFileIgnorePattern: '\\.(test|spec)\\.(ts|tsx)$'` — tests co-locados en `src/routes/` con sufijo `.test.tsx` (Task 14: `clientes.edit.integration.test.tsx`). Este patrón ya está documentado en Story 2.3.
- **CSS ordering** — `siesa-ui-kit/styles.css` → `react-loading-skeleton/dist/skeleton.css` → `./index.css`; NO cambiar orden.
- **409 en EF Core InMemory**: NO enforcea unique indexes en `SaveChangesAsync` — Task 5 valida el 409 via mock del handler; Task 7 marca los tests HTTP de 409 como InMemory-skip con nota inline (patrón heredado de Story 2.3).

### Test design references

`_bmad-output/test-design-epic-2.md` — Story 2.4 mapea a:

- **P0#1:** Create + Edit + Delete cliente reflects immediately on list (FR27) — Task 14 integration test happy path (edit branch).
- **P0#7:** Each mutation hook invalidates `['clientes']` query key — Task 9 spy on `invalidateQueries` (queryKey `['clientes']` **y** `['clientes', id]`).
- **P0#9:** Required fields validation prevents submit on empty Nombre/NIT/Teléfono/Ciudad (FR8, AC-E2.4) — Task 10 empty-field submit test aplicado al edit.
- **P1#7:** Edit form pre-filled with current values (FR6, AC-2.4) — Task 10 `renders with pre-filled fields when mode="edit"`; Task 14 test 1 verifica que los inputs tienen los valores del cliente al abrir.
- **P1#10:** PUT /clientes/{id} updates only mutable fields; created_at unchanged — Task 7 `UpdateCliente_PreservesCreatedAt`.
- **R-002 mitigation:** unique index + 409 mapping + inline UI error — Tasks 4, 6, 7, 9, 10.
- **R-004 mitigation:** `invalidateQueries(['clientes'])` + `invalidateQueries(['clientes', id])` + `setQueryData` map-in-place — Task 9.
- **R-008 mitigation:** server-first flow (no optimistic pre-PUT; el modal se cierra sólo tras 200) — Task 9 + Task 10.
- **R-011 mitigation:** exactitud del copy de toasts + mensajes inline — Task 10 asserts on exact strings (`"Cliente actualizado correctamente"`, `"El NIT/RUC ya está registrado"`, `"No se pudo guardar. Intenta de nuevo."`).
- **R-012 mitigation:** trim server-side (`ClienteEntity.Update`) + trim frontend (Zod `.trim()` reutilizado) — Tasks 1, 3, 8.

**Suite ATDD:** `sa-quick-dev` puede generar `e2e/tests/clientes/story-2.4-edit-client.spec.ts` con Playwright + `page.route()` mocks. Los asserts equivalentes viven en Vitest (Tasks 10 y 14) para el sandbox sin Playwright browsers.

### Git intelligence (últimos commits sobre patrones a seguir)

- Story 2.1 (`2cfbdc4`), Story 2.2 (`5280270`) y Story 2.3 (por completar) dejaron el patrón backend `SiesaAgents.{Layer}/Clientes/{Kind}/*.cs`. Replicar para `Commands/UpdateClienteCommand.cs`, `Commands/UpdateClienteCommandHandler.cs`, `Validators/UpdateClienteRequestValidator.cs`, `DTOs/UpdateClienteRequest.cs`, y `Domain/Clientes/Exceptions/ClienteNotFoundException.cs`.
- Story 2.3 dejó el patrón frontend `frontend/src/modules/crm/clientes/{layer}/*.ts`. `useUpdateCliente.ts` va en `application/`; la extensión de `ClienteFormModal` en `presentation/` (no crear archivo nuevo). El test integration de Task 14 va en `src/routes/clientes.edit.integration.test.tsx` (Story 2.3 patrón `clientes.create.integration.test.tsx`).
- Story 2.3 usa el prefijo `wip(epic-2/story-2.3): ...` — respetar `wip(epic-2/story-2.4): ...` para consistencia de historial.

### Latest tech info (Web research)

- **React Hook Form 7 — `defaultValues` vs `reset`**: `defaultValues` sólo se leen al mount inicial; para actualizar el form cuando cambia una prop (ej: el cliente activo en edit mode), llamar `reset(newValues)` explícitamente dentro de un `useEffect` — patrón oficial documentado en https://react-hook-form.com/docs/useform/reset.
- **TanStack Query 5 `setQueryData` — map-in-place**: `queryClient.setQueryData<Cliente[]>(['clientes'], (prev) => prev?.map(...))` — el updater function permite mutación derivada preservando orden (patrón opuesto a Story 2.3 que reinsertaba al head). Referencia: https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientsetquerydata.
- **TanStack Query 5 — `invalidateQueries` con multiple keys**: cada `invalidateQueries({ queryKey })` es una operación separada; no hay problema en llamarla dos veces con distintas keys en la misma `onSuccess`. Referencia: https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation.
- **FluentValidation 12 — reutilización de reglas**: dos `AbstractValidator<T>` distintos (Create y Update) pueden compartir reglas sin dependencia; alternativa vía composición (`Include<TValidator>()`) rechazada por overhead innecesario en un contexto de 4 reglas idénticas.
- **EF Core 10 — `Update` sobre entidad detached**: `_db.Set<TEntity>().Update(entity)` marca la entidad como `Modified` en el ChangeTracker; funciona con entidades traídas por `AsNoTracking()`. Documentación: https://learn.microsoft.com/en-us/ef/core/change-tracking/entity-entries.
- **Npgsql 10 — `PostgresException.ConstraintName`**: disponible cuando el error viene de una violación de constraint nombrado (unique, FK, check). Es `null` para errores no relacionados con constraints — el helper `IsUniqueNitViolation` maneja esto con `pg.ConstraintName is null || pg.ConstraintName.Equals("uk_clientes_nit", ...)`.
- **siesa-ui-kit `Button` `type="outline"`**: variante visual secundaria; sin borde relleno, texto en color primario, borde 1px. Ideal para acciones secundarias como `"Editar"` junto a un heading. Referencia: `frontend/node_modules/siesa-ui-kit/dist/components/Button/Button.types.d.ts`.
- **Heroicons 24 outline `PencilSquareIcon`**: icono estándar para edit; opcional pero recomendado por UX spec — línea 611 del ux-design-specification.md nombra `"Editar"` como caso de uso de botón secundario, y línea 907 lista `Button` editar como patrón.

### Project Structure Notes

**Archivos creados por esta historia:**

Backend:
- `backend/src/SiesaAgents.Domain/Clientes/Exceptions/ClienteNotFoundException.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteRequestValidatorTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityUpdateTests.cs` (o extensión de `ClienteEntityTests.cs`)

Frontend:
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.tsx`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.update.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.edit.test.tsx` (o casos añadidos a `ClienteFormModal.test.tsx`)
- `frontend/src/routes/clientes.edit.integration.test.tsx`

**Archivos modificados por esta historia:**

Backend:
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — añade método instancia `Update(...)`.
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — añade `UpdateAsync(ClienteEntity, CancellationToken)`.
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implementa `UpdateAsync` (Update + SaveChanges).
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — añade `MapPut("/{id:guid}", ...)` con 200/400/404/409.
- `backend/src/SiesaAgents.API/Program.cs` — registra `UpdateClienteCommandHandler` + `IValidator<UpdateClienteRequest>` en DI.
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — añade 10+ tests (200, 404 unknown, 400 invalid guid, 400 empty, 400 whitespace, 400 maxlength, 409 duplicate, 409 rollback, 200 same-nit no-conflict, trim, preserves createdAt).
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/*.cs` — extiende fakes de `IClienteRepository` con stub `UpdateAsync`.

Frontend:
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — añade tipo `UpdateClientePayload` + método `update`.
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implementa `update` (Axios PUT).
- `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.tsx` — extiende `ClienteFormModalProps` a discriminated union create/edit; ajusta `defaultValues`, `useEffect` y `handleSubmit`; título dinámico; mutación activa según modo.
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — añade botón `"Editar"` en el header + `useState(isEditOpen)` + renderiza `<ClienteFormModal mode="edit" ... />` al final.
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` — añade 4+ tests nuevos.
- `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.test.tsx` — añade tests para modo edit; asegura que create sigue intacto (backward compat).
- `frontend/src/modules/crm/clientes/index.ts` — exporta `useUpdateCliente`.
- `frontend/src/test/msw/handlers.ts` — añade `http.put` handler con 404 + 409 + 200 + trim.

**NO creados en esta historia:**
- `useDeleteCliente` (Story 2.5) — Story 2.4 solo entrega Update.
- Endpoint `DELETE /api/v1/clientes/{id}` (Story 2.5).
- `SortControl` (Story 2.6).
- Contacto CRUD (Épica 3).

**Conflictos detectados y resolución:**
- **`ClienteFormModal` cambia su firma** de `{ isOpen, onClose }` a un discriminated union `{ mode?: 'create', ... } | { mode: 'edit', clienteId, initialValues, ... }`. El default `mode = 'create'` mantiene la firma retrocompatible: `<ClienteFormModal isOpen={...} onClose={...} />` sigue siendo válido en `ClienteListView.tsx` (Story 2.3). Los tests heredados de Story 2.3 pasan sin cambios.
- **`ClienteDetailView` cambia de `<section>` a `<>...</>`** para permitir el modal al mismo nivel del `<section>` (sin ser recortado por overflow). Los tests que buscan `role="region"` (rol implícito del `<section>`) siguen funcionando porque el rol viene del atributo `role="region"` explícito, no del wrapper.
- **`ClienteEntity.Nombre/Nit/Telefono/Ciudad/UpdatedAt` cambian de `private set` a nada** (siguen siendo `private set` — el método `Update(...)` los muta desde dentro de la misma clase). NO se expone `public set` — mantiene el invariante DDD.

### References

- Epic 2 source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.4]
- Epic 2 AC-E2.3 (ver detalle + editar + guardar) y AC-E2.4 (validación campos requeridos): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Epic 2]
- Functional Requirements FR6, FR8, FR27: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management]
- Non-Functional Requirements NFR2, NFR5, NFR6: [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md]
- Architecture — API endpoints (`PUT /api/v1/clientes/{id}`): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — Mutation pattern (`invalidateQueries` + toast): [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- Architecture — Backend folder structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Frontend `useUpdateCliente` layout: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Error handling (Problem Details RFC 7807, no stack traces, NFR6): [Source: _bmad-output/planning-artifacts/architecture.md#Error handling]
- UX spec — Button secondary "Editar": [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Buttons] (línea 611)
- UX spec — Form Patterns + toast copy + Modal & Overlay Patterns: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns, #Form Patterns, #Modal & Overlay Patterns]
- UX spec — Título modal "Editar cliente": [Source: _bmad-output/planning-artifacts/ux-design-specification.md] (línea 970)
- Test design epic-2 P0#1, P0#7, P0#9 + P1#7, P1#10 + R-002/R-004/R-008/R-011/R-012 mitigations: [Source: _bmad-output/test-design-epic-2.md]
- Story 2.1 handoff (ClienteEntity, uk_clientes_nit, MSW seed): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Story 2.2 handoff (ClienteDetailView, getById, AsNoTracking): [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md]
- Story 2.3 handoff (ClienteFormModal, DuplicateNitException, ToastProvider, MSW POST, siesa-ui-kit Button prop naming): [Source: _bmad-output/implementation-artifacts/2-3-create-client.md]
- Company standards (Clean Arch + DDD, stack, WCAG 2.1 AA, es-CO/EN split, DateTimeOffset, Problem Details, Scalar, snake_case, FluentValidation + Zod split): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- MasterCrud reference (not used in this story — see Alignment section): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- TanStack Query 5 `setQueryData` + `invalidateQueries`: [Source: https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient]
- React Hook Form `reset(newValues)` pattern: [Source: https://react-hook-form.com/docs/useform/reset]
- FluentValidation 12 rules: [Source: https://docs.fluentvalidation.net/en/latest/built-in-validators.html]
- Npgsql `PostgresException.ConstraintName`: [Source: https://www.npgsql.org/doc/api/Npgsql.PostgresException.html]
- Problem Details RFC 7807 + RFC 9110 status codes (200/404/409): [Source: https://datatracker.ietf.org/doc/html/rfc7807, https://www.rfc-editor.org/rfc/rfc9110]

### UI Implementation Requirements (MANDATORY)

- **Library:** `siesa-ui-kit@^1.0.255` (ya instalado desde Story 1.2).
- **Install:** N/A — ya está en `frontend/package.json`.
- **Usage:** Se DEBEN usar componentes de `siesa-ui-kit` para todos los primitivos UI donde exista un equivalente. En esta historia: `Button` (botón "Editar" en detalle — `type="outline"`; botón "Guardar" del form — reutilizado), `Input` (los 4 campos — reutilizados), `AlertDialog` (contenedor del modal — reutilizado, sólo cambia `title`), `Toast` + `toast(...)` (feedback de éxito y error — reutilizados).
- **Constraint:** NO crear un `Input`, `Button`, `Modal` ni `Toast` custom. El `ClienteFormModal` extendido sigue siendo una **composición** que envuelve primitivos siesa-ui-kit + Tailwind + Heroicons. NO se duplica el componente en un archivo separado (`ClienteEditModal.tsx`) — la reutilización via `mode` prop es el patrón intencional.
- **MasterCrud:** NO aplica a Story 2.4 (justificado en "Alignment with company standards" arriba). Documentar sin implementar.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (sa-dev-story sub-agent, dev-story workflow)

### Debug Log References

- Backend: `dotnet build` 0 errors + `dotnet test tests/SiesaAgents.UnitTests` 137 passed + `dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ClienteEndpointsTests` 28 passed.
- Frontend: `pnpm --filter frontend build` 0 TS errors + `pnpm --filter frontend test` 227/227 passed + `pnpm --filter frontend lint` clean (only pre-existing warnings inherited from prior stories).
- Sandbox limits (non-blocking, per Story 2.3 handoff):
  * `MigrationsAndSnakeCaseTests` requires Docker → fails locally with "Docker is either not running or misconfigured". Runs only in CI/staging.
  * Playwright ATDD suites (`e2e/tests/clientes/story-2.4-edit-client.spec.ts` — 26 E2E; `e2e/tests/api/story-2.4-edit-client.api.spec.ts` — 13 API contract) require Playwright browsers + a running backend/frontend on 5000/5173. Not runnable in the sandbox; equivalent assertions live in Vitest (useUpdateCliente.test.tsx, ClienteFormModal.edit.test.tsx, clientes.edit.integration.test.tsx) and xUnit (UpdateClienteCommandHandlerTests, UpdateClienteRequestValidatorTests, ClienteEndpointsTests.UpdateCliente_*).
  * Backend `409 Conflict` on `UpdateCliente` cannot be reproduced via EF Core InMemory (unique index not enforced) — coverage lives in `UpdateClienteCommandHandlerTests.HandleAsync_RepositoryThrowsUniqueViolation_ThrowsDuplicateNit` (synthetic PostgresException) and in the E2E API contract suite.

### Completion Notes List

- **Backend** — Domain, Application, Infrastructure, API and Tests wired end-to-end. `ClienteEntity.Update(...)` mutates the 4 fields, trims, refreshes `UpdatedAt`, preserves `Id`/`CreatedAt` (invariants tested). `UpdateClienteCommandHandler` fetches → domain-mutates → persists → maps null→404 (`ClienteNotFoundException`) and 23505→409 (`DuplicateNitException`); other DbUpdateException propagates. Endpoint `PUT /api/v1/clientes/{id:guid}` returns 200/400/404/409 with Problem Details RFC 7807 (`field: "nit"` at top-level via `extensions:` — matches ASP.NET flattening).
- **Frontend** — `ClienteFormModal` now supports discriminated union `mode: 'create' | 'edit'` (default `'create'` keeps Story 2.3 signature intact). Title switches to "Editar cliente"; `defaultValues + reset(initialValues)` pre-fills the four inputs; on 409 shows inline NIT error and keeps modal open; on 404/5xx fires red toast and keeps modal open; on cancel/Esc/✕ modal closes without submit and reopening restores original values. `useUpdateCliente` invalidates BOTH `['clientes']` and `['clientes', id]`, replaces list cache in-place (order preserved — no head reinsert), sets byId cache to updated DTO. `ClienteDetailView` renders an `Editar` button (`type="outline"`, `aria-label="Editar cliente"`) only in the happy branch; it opens the shared `ClienteFormModal` in edit mode.
- **MSW** — Added `http.put('*/api/v1/clientes/:id', ...)` returning 200 with trimmed persisted DTO, 404 for unknown id, and 409 only when the new NIT collides against a DIFFERENT existing row (same-row-same-NIT stays 200 — matches uk_clientes_nit semantics).
- **Backward compat** — `<ClienteFormModal isOpen onClose />` (Story 2.3 create call site) still works because `mode` defaults to `'create'` and the discriminated union permits omitting `mode`.

### File List

Created:
- `backend/src/SiesaAgents.Domain/Clientes/Exceptions/ClienteNotFoundException.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteRequestValidatorTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityUpdateTests.cs`
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.tsx`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.update.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.edit.test.tsx`
- `frontend/src/routes/clientes.edit.integration.test.tsx`

Modified:
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — added `Update(...)` instance method with trim + invariants + UpdatedAt refresh.
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — added `UpdateAsync(...)`.
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implemented `UpdateAsync` using `_db.Clientes.Update(entity)` + `SaveChangesAsync`.
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — added `MapPut("/{id:guid}", ...)`.
- `backend/src/SiesaAgents.API/Program.cs` — DI registration for `UpdateClienteCommandHandler` + `IValidator<UpdateClienteRequest>`.
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs` — stubbed `UpdateAsync` in fake.
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerEdgeCasesTests.cs` — stubbed `UpdateAsync` in fake.
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` — stubbed `UpdateAsync` in fake.
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` — stubbed `UpdateAsync` in fake.
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — added 10 UpdateCliente_* HTTP integration tests.
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — added `UpdateClientePayload` type + `update(...)` method.
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implemented `update` via `apiClient.put`.
- `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.tsx` — discriminated union `mode: 'create' | 'edit'`; pre-fills defaultValues + reset on isOpen change; dynamic title; active mutation switch.
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — added `Editar` button + `useState(isEditOpen)` + `<ClienteFormModal mode="edit" ...>` render, wrapped in `<>` fragment for modal-outside-section rendering.
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` — added 4 Story 2.4 tests.
- `frontend/src/modules/crm/clientes/index.ts` — exported `useUpdateCliente` + `UpdateClientePayload`.
- `frontend/src/test/msw/handlers.ts` — added PUT handler with 200/404/409 semantics.
