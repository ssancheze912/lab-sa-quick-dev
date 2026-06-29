# Story 2.3: Create Client

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new client by filling in a form,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the database table `clientes` exists with the unique index `uk_clientes_nit` (already shipped in Story 2.1) and the request body `{ nombre, nitRuc, telefono, ciudad }` is provided with non-empty values that respect the entity length caps (Nombre ≤ 200, Nit ≤ 50, Telefono ≤ 50, Ciudad ≤ 100), **When** the developer issues `POST http://localhost:5000/api/v1/clientes` with `Content-Type: application/json`, **Then** the backend returns `201 Created` with `Content-Type: application/json` and a body that is a single `ClienteDto` JSON object shaped as `{ id: string-uuid (newly generated), nombre, nitRuc, telefono, ciudad, createdAt: string-iso8601, updatedAt: string-iso8601 }` (camelCase). The response `Location` header MUST point to `/api/v1/clientes/{newId}`. The new row MUST be persisted to PostgreSQL and visible to a subsequent `GET /api/v1/clientes/{newId}` (200) and `GET /api/v1/clientes` (the new id appears in the returned array). `createdAt` and `updatedAt` are equal on creation; both are populated by the entity factory (`DateTimeOffset.UtcNow`). [AC-2.3.a, FR1, FR27, TC-E2-P0-01 API leg]

2. **Given** the request body is empty (`{}`) or omits any of the four required fields, or any required field is whitespace-only, or any field exceeds the entity length cap, **When** the developer issues `POST /api/v1/clientes`, **Then** the backend returns `400 Bad Request` with `Content-Type: application/problem+json` and a Problem Details RFC 7807 body that includes a populated `errors` dictionary keyed by field name (camelCase: `nombre`, `nitRuc`, `telefono`, `ciudad`) listing the failing rules. The body MUST NOT include the entity name `ClienteEntity`, the `DbContext`, SQL fragments, stack traces, or the internal field name `Nit` (NFR6). No row is persisted (a follow-up `GET /api/v1/clientes` reflects no change). [AC-2.3.b, FR8, NFR5, NFR6, TC-E2-P0-02 API leg]

3. **Given** a client `C1` with `nitRuc = "900111222-3"` already exists in the database (seeded via a prior 201), **When** the developer issues a second `POST /api/v1/clientes` with the SAME `nitRuc` (any `nombre`/`telefono`/`ciudad`), **Then** the backend returns `409 Conflict` with `Content-Type: application/problem+json` and a Problem Details body whose `title` is `"NIT/RUC duplicado"`, `status` is `409`, `type` is `"https://tools.ietf.org/html/rfc7231#section-6.5.8"`, `instance` is `"/api/v1/clientes"`, and `detail` is the user-safe Spanish string `"El NIT/RUC ya está registrado"`. The body MUST NOT contain `"23505"` (Postgres SQLSTATE), `"DbUpdateException"`, `"uk_clientes_nit"`, `"ClienteEntity"`, SQL fragments, or stack traces (NFR6). The duplicate row MUST NOT be persisted. [AC-2.3.c, NFR5, NFR6, TC-E2-P0-03 API leg, R2]

4. **Given** the user is on the `/clientes` view (left list rendered, right panel showing either the placeholder "Selecciona un cliente para ver sus detalles" or a detail view), **When** the user clicks the visible "Nuevo cliente" button (which lives in the left panel's sticky header above the search input — always visible regardless of list state), **Then** an `AlertDialog` (siesa-ui-kit) opens with title `"Nuevo cliente"` and a form containing exactly four fields rendered in this order with `<Input>` (siesa-ui-kit) controls: `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`. Each input MUST have a visible `label`, accept text, and be marked `aria-required="true"`. The dialog footer MUST contain a primary `Button` `"Guardar"` (default type, submit) and a secondary `Button` `"Cancelar"` (outline, type=button) wired to `onCancel`. The left list panel and the right panel remain mounted underneath the dialog (no route change). [Story 2.3 AC1, FR1, UX-spec §Phase 3]

5. **Given** the create form is open, **When** the user clicks `"Guardar"` without filling one or more required fields (any of Nombre, NIT/RUC, Teléfono, Ciudad is empty or whitespace), **Then** React Hook Form + Zod block submission, the form is NOT submitted to the backend (MSW spy on `POST /api/v1/clientes` MUST receive 0 calls), and each empty field renders an inline error message in Spanish below its input: `"El nombre es obligatorio"`, `"El NIT/RUC es obligatorio"`, `"El teléfono es obligatorio"`, `"La ciudad es obligatoria"`. The first failing field MUST receive focus. The dialog stays open. [Story 2.3 AC3, FR8, NFR5, TC-E2-P0-02 UI leg, R4]

6. **Given** the user fills all four required fields with valid values and clicks `"Guardar"`, **When** the frontend issues `POST /api/v1/clientes` and the backend returns `201` with the new `ClienteDto`, **Then** (a) the dialog closes; (b) the TanStack Query cache for `queryKey: ['clientes']` is updated to include the new client at the **top** of the list (matching the default `ORDER BY created_at DESC` from `ClienteRepository.GetAllAsync`) using `queryClient.setQueryData(['clientes'], ...)` — NOT a refetch (NFR2: <2 s UI update; FR27: immediate); (c) the new `ClientListItem` appears in the left list with its Nombre and NIT/RUC visible; (d) a `success` toast (siesa-ui-kit `toast.success`) appears with message `"Cliente creado correctamente"` and the default position; (e) no console error fires. [Story 2.3 AC2, FR1, FR27, NFR2, TC-E2-P0-01 UI leg]

7. **Given** the user submits the form with a `nitRuc` that already exists, **When** the backend returns `409 Conflict` with the Problem Details body defined in AC #3, **Then** (a) the dialog stays open with the user's typed values preserved (no form reset); (b) an inline error appears beneath the `NIT/RUC` input reading exactly `"El NIT/RUC ya está registrado"` (sourced from `problem.detail`, NEVER from `problem.title`, `problem.errors`, or raw HTTP text); (c) no toast is shown for the 409 branch (the inline error is the user feedback); (d) the rendered DOM MUST NOT contain `"23505"`, `"DbUpdateException"`, `"uk_clientes_nit"`, `"409"`, or `"about:blank"` (NFR6); (e) the cache for `['clientes']` is unchanged. [Story 2.3 AC4, NFR5, NFR6, TC-E2-P0-03 UI leg, R2]

8. **Given** the create call fails with a non-409 server error (500 / network down / 4xx other than 400/409), **When** TanStack Query's mutation reports `status === 'error'`, **Then** (a) the dialog stays open; (b) an error toast (siesa-ui-kit `toast.error`) appears with message `"No pudimos crear el cliente. Inténtalo de nuevo."`; (c) the rendered DOM MUST NOT contain the raw HTTP status code, the Problem Details `type`, `instance`, `detail`, or any stack trace string (NFR6); (d) the `["clientes"]` cache is unchanged (no optimistic write was performed); (e) the form keeps its values so the user can retry. The 400 path (validation) is handled inline per AC #5 and never reaches this branch (server-side validation is a safety net — the client-side schema prevents 400 in practice). [Story 2.3 AC2 (negative), NFR6, R5]

9. **Given** the user clicks `"Cancelar"` or presses `Escape` while the dialog is open, **When** the close handler fires, **Then** the dialog closes, no `POST` request is fired (MSW spy MUST receive 0 calls), the form state is reset (a subsequent reopen shows empty fields), and the `['clientes']` cache is untouched. The dialog MUST NOT close on backdrop click while a submission is in flight (`AlertDialog.preventCloseOnOverlayClick={isSubmitting}`). [Story 2.3 AC1 (negative), UX guard rail]

10. **Given** the form is submitting (`mutation.isPending === true`), **When** the dialog re-renders, **Then** the `"Guardar"` button shows the processing state (`AlertDialog.isProcess={isSubmitting}` propagates through the siesa-ui-kit `Button` loading indicator), the four `<Input>` fields are disabled (`disabled={isSubmitting}`), and the `"Cancelar"` button is also disabled. A second click on `"Guardar"` MUST NOT fire a second `POST` (React Hook Form's `formState.isSubmitting` and the mutation's `isPending` together gate the call). [NFR6 UX, R5]

## Tasks / Subtasks

- [ ] **Task 1 — Backend: `ClienteValidator` (FluentValidation)** (AC: #2)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/ClienteValidator.cs`. Define a `sealed class ClienteValidator : AbstractValidator<CreateClienteCommand>` (the command lands in Task 2). Rules:
    - `RuleFor(c => c.Nombre).NotEmpty().WithMessage("El nombre es obligatorio").MaximumLength(200).WithMessage("El nombre no puede exceder 200 caracteres");`
    - `RuleFor(c => c.NitRuc).NotEmpty().WithMessage("El NIT/RUC es obligatorio").MaximumLength(50).WithMessage("El NIT/RUC no puede exceder 50 caracteres");`
    - `RuleFor(c => c.Telefono).NotEmpty().WithMessage("El teléfono es obligatorio").MaximumLength(50).WithMessage("El teléfono no puede exceder 50 caracteres");`
    - `RuleFor(c => c.Ciudad).NotEmpty().WithMessage("La ciudad es obligatoria").MaximumLength(100).WithMessage("La ciudad no puede exceder 100 caracteres");`
    - `NotEmpty()` covers null, empty, and whitespace-only inputs (FluentValidation default).
  - [ ] Register the validator in `ApplicationServiceCollectionExtensions.AddApplication()`: `services.AddScoped<IValidator<CreateClienteCommand>, ClienteValidator>();`. Add the `FluentValidation` using directive.

- [ ] **Task 2 — Backend: `CreateClienteCommand` + Handler** (AC: #1, #2, #3)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs` as `public sealed record CreateClienteCommand(string Nombre, string NitRuc, string Telefono, string Ciudad);`.
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs` exposing `Task<ClienteDto> HandleAsync(CreateClienteCommand command, CancellationToken ct)`:
    1. Run the FluentValidation `_validator.ValidateAsync(command, ct)`; if invalid throw a custom `ValidationException` (FluentValidation's built-in) — the endpoint translates it to a 400 Problem Details (Task 3, step `b`).
    2. Check `_repository.ExistsByNitAsync(command.NitRuc, ct)` BEFORE inserting. If `true`, throw a new sealed exception `DuplicateNitException(command.NitRuc)` placed in `SiesaAgents.Application/Clientes/Exceptions/DuplicateNitException.cs` (`: Exception`). The handler MUST NOT include the value of the NIT in the exception's `Message` — only carry it on a `public string Nit { get; }` property for logging.
    3. Build the entity with `ClienteEntity.Create(command.Nombre, command.NitRuc, command.Telefono, command.Ciudad)` (this enforces FR8 + length caps as a defense-in-depth — the validator should already have rejected bad input but the entity factory is the domain invariant).
    4. Call `_repository.AddAsync(entity, ct)`.
    5. Map to `ClienteDto` using the SAME projection used by `GetClientesQueryHandler` (id, nombre, Nit→NitRuc, telefono, ciudad, createdAt, updatedAt).
    6. Return the dto.
  - [ ] Register in `ApplicationServiceCollectionExtensions.AddApplication()`: `services.AddScoped<CreateClienteCommandHandler>();`.
  - [ ] **DO NOT use `try/catch` on the EF Core save** to detect the unique violation. The pre-check via `ExistsByNitAsync` is the authoritative path (already present on `IClienteRepository`). The race-condition window (two concurrent POSTs of the same NIT in <50ms) is acceptable for the MVP per NFR10 (10 users) — the second insert will throw a `DbUpdateException` from EF Core, which falls through to the existing `ExceptionHandlingMiddleware` and returns a 500 Problem Details. Document this in Completion Notes; tighten in a future story if the audit reveals concurrent collisions.

- [ ] **Task 3 — Backend: `POST /api/v1/clientes` endpoint** (AC: #1, #2, #3)
  - [ ] In `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`, add inside the existing `MapGroup("/api/v1/clientes")`:
    ```csharp
    group.MapPost("/", async (
            CreateClienteCommand command,
            CreateClienteCommandHandler handler,
            CancellationToken ct) =>
        {
            try
            {
                var result = await handler.HandleAsync(command, ct);
                return Results.Created($"/api/v1/clientes/{result.Id}", result);
            }
            catch (FluentValidation.ValidationException vex)
            {
                var errors = vex.Errors
                    .GroupBy(e => ToCamelCase(e.PropertyName))
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(
                    errors,
                    title: "Datos inválidos",
                    type: "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                    instance: "/api/v1/clientes");
            }
            catch (DuplicateNitException)
            {
                return Results.Problem(
                    title: "NIT/RUC duplicado",
                    detail: "El NIT/RUC ya está registrado",
                    statusCode: StatusCodes.Status409Conflict,
                    type: "https://tools.ietf.org/html/rfc7231#section-6.5.8",
                    instance: "/api/v1/clientes");
            }
        })
        .WithName("CreateCliente")
        .WithOpenApi();
    ```
    Plus a private static helper `ToCamelCase(string)` that lowercases the first character (`PropertyName` from FluentValidation comes in PascalCase: `Nombre`, `NitRuc`, `Telefono`, `Ciudad` → `nombre`, `nitRuc`, `telefono`, `ciudad`). `Results.ValidationProblem` already emits `application/problem+json` with the `errors` map per RFC 7807.
  - [ ] Do NOT alter the existing `MapGet("/", ...)` or `MapGet("/{id:guid}", ...)`.
  - [ ] The endpoint MUST NOT log `command.NitRuc` at info-level (only at debug or below). The user-facing 409 `detail` is the safe Spanish string — no exception type names, no SQL.

- [ ] **Task 4 — Backend: Unit tests for `CreateClienteCommandHandler`** (AC: #1, #2, #3)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`.
  - [ ] Test cases (xUnit + Moq/NSubstitute, no DB):
    - `HandleAsync_WhenAllFieldsValidAndNitUnique_PersistsAndReturnsDto` — repository's `ExistsByNitAsync` returns false; assert `AddAsync` is called once with an entity whose properties match the command; assert returned dto has a non-empty `Id`, `Nombre`/`NitRuc`/`Telefono`/`Ciudad` matching, `CreatedAt == UpdatedAt`.
    - `HandleAsync_WhenNitAlreadyExists_ThrowsDuplicateNit_AndDoesNotPersist` — `ExistsByNitAsync` returns true; assert the handler throws `DuplicateNitException` whose `Nit` property equals the command's NitRuc; assert `AddAsync` was NEVER called.
    - `HandleAsync_WhenValidatorRejects_ThrowsValidationException_AndDoesNotPersist` — pass an empty-nombre command; the registered validator throws `ValidationException` with `Errors` keyed by `"Nombre"`; assert `ExistsByNitAsync` and `AddAsync` are both never called.
    - `HandleAsync_PassesCancellationTokenToRepository` — assert the ct is forwarded verbatim on both `ExistsByNitAsync` and `AddAsync`.
  - [ ] Mirror the existing pattern in `GetClienteByIdQueryHandlerTests.cs`/`GetClientesQueryHandlerTests.cs` for mocking style and Arrange/Act/Assert structure.

- [ ] **Task 5 — Backend: Unit tests for `ClienteValidator`** (AC: #2, NFR5)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/ClienteValidatorTests.cs` using `FluentValidation.TestHelper`:
    - Empty / whitespace / null for each of the 4 fields → `ShouldHaveValidationErrorFor` with the exact Spanish message ("El nombre es obligatorio", etc.).
    - Length > cap for each field → `ShouldHaveValidationErrorFor` with the length message.
    - All four fields populated with valid values → `ShouldNotHaveAnyValidationErrors`.
    - Sanitization-like input in `Nombre` (e.g., `"O'Reilly & Co."`) → valid (sanitization is handled by EF Core parameterization, not the validator).
  - [ ] These map to TC-E2-P3-01 in the test design.

- [ ] **Task 6 — Backend: Integration tests** (AC: #1, #2, #3)
  - [ ] Create `backend/tests/SiesaAgents.IntegrationTests/Api/CreateClienteEndpointTests.cs` booting `WebApplicationFactory<Program>` over Testcontainers Postgres 18 (same pattern as `ClientesEndpointAtddTests` / `ClienteByIdEndpointTests`). Apply migrations via `MigrateAsync`.
  - [ ] Test cases:
    - `Post_ReturnsCreated201_AndPersists_WhenAllFieldsValid` — POST a valid body, assert `201`, `Content-Type: application/json`, `Location` header matches `/api/v1/clientes/{id}`, response body has a non-empty UUID `id`, `nitRuc` camelCase echoed, `createdAt`/`updatedAt` ISO 8601. Follow up with a `GET /api/v1/clientes/{id}` → 200 and a `GET /api/v1/clientes` → 200 array containing the new id.
    - `Post_Returns400Problem_WhenBodyIsEmpty` — POST `{}`; assert `400`, `Content-Type` startsWith `application/problem+json`, `errors` dictionary has 4 keys (`nombre`, `nitRuc`, `telefono`, `ciudad`) each with non-empty Spanish messages. Assert the body does NOT contain `"ClienteEntity"`, `"DbContext"`, `"Nit "`/`"\"Nit\""` (internal field name), or any SQL fragment (NFR6).
    - `Post_Returns400_WhenSingleFieldMissing` — parameterized test (xUnit `[Theory]`) over each of the 4 fields: POST with that field omitted, the other 3 populated → 400, `errors` dictionary contains ONLY the omitted field's key.
    - `Post_Returns409Problem_WhenNitAlreadyExists` — seed one client via a prior POST, then POST again with the same `nitRuc` (different `nombre`); assert `409`, `Content-Type` startsWith `application/problem+json`, body has `title = "NIT/RUC duplicado"`, `detail = "El NIT/RUC ya está registrado"`, `status = 409`, `type` is the RFC 7231 §6.5.8 URL. Assert the body does NOT contain `"23505"`, `"DbUpdateException"`, `"uk_clientes_nit"`, `"ClienteEntity"`, or SQL fragments (NFR6). Assert a follow-up `GET /api/v1/clientes` returns exactly ONE client (the duplicate was rejected).
    - `Post_PersistsCreatedAtAndUpdatedAtEqual_OnFirstInsert` — POST a valid body; parse `createdAt` and `updatedAt` from the response; assert both are equal (within 1 ms tolerance to account for any serialization round-trip).
  - [ ] Do NOT alter the existing `ClientesEndpointAtddTests` / `ClienteByIdEndpointTests` files.

- [ ] **Task 7 — Frontend: Extend domain contract** (AC: #6)
  - [ ] Edit `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` and ADD a `create(input: CreateClienteInput): Promise<Cliente>` method to the interface. Define `CreateClienteInput` either inline in the interface or in a new file `frontend/src/modules/crm/clientes/domain/CreateClienteInput.ts`:
    ```ts
    export interface CreateClienteInput {
      nombre: string
      nitRuc: string
      telefono: string
      ciudad: string
    }
    ```
  - [ ] The `create` JSDoc MUST note: "Throws `DuplicateNitError` (from `./errors`) when the backend returns 409. Throws `ClienteValidationError` (from `./errors`) when the backend returns 400 with field-level errors. All other failures bubble up as the underlying transport error."

- [ ] **Task 8 — Frontend: Typed errors for 409 + 400** (AC: #7, #8)
  - [ ] Edit `frontend/src/modules/crm/clientes/domain/errors.ts` and ADD two new error classes alongside the existing `ClienteNotFoundError`:
    ```ts
    /**
     * Story 2.3 — Typed error for the 409 branch of POST /api/v1/clientes.
     * The UI inspects `error instanceof DuplicateNitError` to render the inline
     * "El NIT/RUC ya está registrado" message under the NIT/RUC input. NFR6:
     * the message is a fixed Spanish user-safe string; the underlying Problem
     * Details body is dropped at the infrastructure layer.
     */
    export class DuplicateNitError extends Error {
      constructor() {
        super('El NIT/RUC ya está registrado')
        this.name = 'DuplicateNitError'
      }
    }

    /**
     * Story 2.3 — Typed error for the 400 branch of POST /api/v1/clientes
     * (defensive — the client-side Zod schema should prevent reaching it). The
     * `fieldErrors` map is keyed by the same camelCase keys the form uses:
     * `nombre`, `nitRuc`, `telefono`, `ciudad`.
     */
    export class ClienteValidationError extends Error {
      readonly fieldErrors: Readonly<Record<string, readonly string[]>>

      constructor(fieldErrors: Record<string, readonly string[]>) {
        super('Validation failed')
        this.name = 'ClienteValidationError'
        this.fieldErrors = fieldErrors
      }
    }
    ```

- [ ] **Task 9 — Frontend: Infrastructure `create` + typed 400/409 mapping** (AC: #6, #7, #8)
  - [ ] Edit `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` and add:
    ```ts
    async create(input: CreateClienteInput): Promise<Cliente> {
      try {
        const response = await apiClient.post<Cliente>('/api/v1/clientes', input)
        return response.data
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          if (err.response.status === 409) {
            throw new DuplicateNitError()
          }
          if (err.response.status === 400) {
            const body = err.response.data as { errors?: Record<string, string[]> }
            throw new ClienteValidationError(body.errors ?? {})
          }
        }
        throw err
      }
    },
    ```
    Import `CreateClienteInput`, `DuplicateNitError`, `ClienteValidationError`. Do NOT propagate the raw Problem Details body (NFR6) — only the field-level error map (already a list of user-safe strings emitted by the backend) is allowed through, and only for the 400 branch which the UI uses to set inline RHF errors.
  - [ ] Add colocated test cases in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.test.ts` for the new `create` method:
    - 201 → returns the parsed `Cliente`.
    - 409 → throws `DuplicateNitError`.
    - 400 → throws `ClienteValidationError` whose `fieldErrors` equals the body's `errors` map.
    - 500 → re-throws the AxiosError (not wrapped).
    - Network error (no `response`) → re-throws the AxiosError.

- [ ] **Task 10 — Frontend: Zod schema + `useCreateCliente` mutation hook** (AC: #5, #6, #7, #8, #10)
  - [ ] Create `frontend/src/modules/crm/clientes/application/createClienteSchema.ts` exporting a Zod object with exactly the four fields and the same Spanish messages used by the backend (so the user sees consistent copy regardless of which layer rejects):
    ```ts
    import { z } from 'zod'

    export const createClienteSchema = z.object({
      nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(200, 'El nombre no puede exceder 200 caracteres'),
      nitRuc: z.string().trim().min(1, 'El NIT/RUC es obligatorio').max(50, 'El NIT/RUC no puede exceder 50 caracteres'),
      telefono: z.string().trim().min(1, 'El teléfono es obligatorio').max(50, 'El teléfono no puede exceder 50 caracteres'),
      ciudad: z.string().trim().min(1, 'La ciudad es obligatoria').max(100, 'La ciudad no puede exceder 100 caracteres'),
    })

    export type CreateClienteFormValues = z.infer<typeof createClienteSchema>
    ```
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`:
    ```ts
    import { useMutation, useQueryClient } from '@tanstack/react-query'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
    import type { Cliente } from '../domain/Cliente'
    import type { CreateClienteInput } from '../domain/IClienteRepository'

    export function useCreateCliente() {
      const queryClient = useQueryClient()
      return useMutation<Cliente, Error, CreateClienteInput>({
        mutationFn: (input) => clienteApiRepository.create(input),
        onSuccess: (created) => {
          // FR27 / NFR2: prepend to the cached list so the UI updates without a refetch.
          queryClient.setQueryData<Cliente[]>(['clientes'], (prev) =>
            prev ? [created, ...prev] : [created]
          )
        },
        // No retries — POST is non-idempotent.
        retry: false,
      })
    }
    ```
  - [ ] Add colocated `useCreateCliente.test.tsx` covering:
    - Success path: mock 201 → mutation settles to success → cache is updated with the new client prepended.
    - 409 path: mock 409 → mutation settles to `error` with `error instanceof DuplicateNitError === true`; cache is unchanged.
    - 400 path: mock 400 with `errors: { nombre: ["..."] }` → mutation settles to `error` with `error instanceof ClienteValidationError === true`; cache is unchanged.
    - 500 path: mock 500 → mutation settles to error; cache is unchanged.
    - No retry on 500: assert MSW handler is hit exactly once (`retry: false`).

- [ ] **Task 11 — Frontend: `CreateClienteDialog` component** (AC: #4, #5, #6, #7, #8, #9, #10)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/CreateClienteDialog.tsx`:
    ```tsx
    import { useEffect, useRef } from 'react'
    import { useForm } from 'react-hook-form'
    import { zodResolver } from '@hookform/resolvers/zod'
    import { AlertDialog, Input, toast } from 'siesa-ui-kit'
    import {
      createClienteSchema,
      type CreateClienteFormValues,
    } from '../application/createClienteSchema'
    import { useCreateCliente } from '../application/useCreateCliente'
    import { DuplicateNitError, ClienteValidationError } from '../domain/errors'

    export interface CreateClienteDialogProps {
      isOpen: boolean
      onClose: () => void
    }

    export function CreateClienteDialog({
      isOpen,
      onClose,
    }: CreateClienteDialogProps): React.ReactElement | null {
      const {
        register,
        handleSubmit,
        reset,
        setError,
        setFocus,
        formState: { errors, isSubmitting },
      } = useForm<CreateClienteFormValues>({
        resolver: zodResolver(createClienteSchema),
        defaultValues: { nombre: '', nitRuc: '', telefono: '', ciudad: '' },
      })
      const mutation = useCreateCliente()
      const formRef = useRef<HTMLFormElement | null>(null)

      // Reset the form whenever the dialog closes so a reopen shows empty fields.
      useEffect(() => {
        if (!isOpen) {
          reset()
          mutation.reset()
        }
      }, [isOpen, reset, mutation])

      // Focus the first failing field after a Zod validation rejection.
      const firstErrorKey = (Object.keys(errors) as Array<keyof CreateClienteFormValues>)[0]
      useEffect(() => {
        if (firstErrorKey) setFocus(firstErrorKey)
      }, [firstErrorKey, setFocus])

      if (!isOpen) return null

      const submitting = isSubmitting || mutation.isPending

      const onSubmit = handleSubmit(async (values) => {
        try {
          await mutation.mutateAsync(values)
          toast.success('Cliente creado correctamente')
          onClose()
        } catch (err) {
          if (err instanceof DuplicateNitError) {
            setError('nitRuc', {
              type: 'server',
              message: 'El NIT/RUC ya está registrado',
            })
            setFocus('nitRuc')
            return
          }
          if (err instanceof ClienteValidationError) {
            // Defensive — server-side rejection that bypassed the Zod schema.
            for (const [field, messages] of Object.entries(err.fieldErrors)) {
              if (messages.length > 0) {
                setError(field as keyof CreateClienteFormValues, {
                  type: 'server',
                  message: messages[0],
                })
              }
            }
            return
          }
          toast.error('No pudimos crear el cliente. Inténtalo de nuevo.')
        }
      })

      return (
        <AlertDialog
          title="Nuevo cliente"
          isOpen={isOpen}
          onCancel={() => {
            if (!submitting) onClose()
          }}
          onConfirm={() => formRef.current?.requestSubmit()}
          confirmText="Guardar"
          cancelText="Cancelar"
          isProcess={submitting}
          preventCloseOnOverlayClick={submitting}
          size="max-w-md"
        >
          <form
            ref={formRef}
            data-testid="create-cliente-form"
            onSubmit={onSubmit}
            className="flex flex-col gap-3"
            noValidate
          >
            <Input
              label="Nombre"
              aria-required="true"
              data-testid="create-cliente-nombre"
              disabled={submitting}
              error={Boolean(errors.nombre)}
              errorMessage={errors.nombre?.message}
              {...register('nombre')}
            />
            <Input
              label="NIT/RUC"
              aria-required="true"
              data-testid="create-cliente-nitruc"
              disabled={submitting}
              error={Boolean(errors.nitRuc)}
              errorMessage={errors.nitRuc?.message}
              {...register('nitRuc')}
            />
            <Input
              label="Teléfono"
              aria-required="true"
              data-testid="create-cliente-telefono"
              disabled={submitting}
              error={Boolean(errors.telefono)}
              errorMessage={errors.telefono?.message}
              {...register('telefono')}
            />
            <Input
              label="Ciudad"
              aria-required="true"
              data-testid="create-cliente-ciudad"
              disabled={submitting}
              error={Boolean(errors.ciudad)}
              errorMessage={errors.ciudad?.message}
              {...register('ciudad')}
            />
          </form>
        </AlertDialog>
      )
    }
    ```
  - [ ] **siesa-ui-kit API check** (mandatory pre-merge): verify the actual `AlertDialog` props vs. what's coded above by reading `node_modules/siesa-ui-kit/dist/components/AlertDialog/AlertDialog.types.d.ts`. The verified API exposes `title`, `isOpen`, `onCancel`, `onConfirm`, `confirmText`, `cancelText`, `isProcess`, `preventCloseOnOverlayClick`, `size`. If `onConfirm` triggers the confirm button click but does NOT submit the inner form natively, wire it via `formRef.current?.requestSubmit()` (already coded above). Likewise verify `Input` exposes `label`, `error`, `errorMessage`, `aria-required` pass-through (confirmed in the type def — see `Input.types.d.ts`).
  - [ ] **ToastProvider must be mounted at the app root** for `toast.success` / `toast.error` to render. Add `<ToastProvider />` once inside `frontend/src/routes/__root.tsx`'s `RootLayout` if it's not already mounted (verify with `grep -n "ToastProvider" frontend/src/routes/__root.tsx`). The provider is rendered at the bottom of `RootLayout` outside the `LayoutBase` so toasts portal over the entire app.
  - [ ] All user-facing strings are Spanish ("Nuevo cliente", "Guardar", "Cancelar", "Nombre", "NIT/RUC", "Teléfono", "Ciudad", "El nombre es obligatorio", "El NIT/RUC es obligatorio", "El teléfono es obligatorio", "La ciudad es obligatoria", "El NIT/RUC ya está registrado", "Cliente creado correctamente", "No pudimos crear el cliente. Inténtalo de nuevo.").

- [ ] **Task 12 — Frontend: Wire the "Nuevo cliente" button into the left panel** (AC: #4)
  - [ ] Edit `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    - Add `useState<boolean>` for `isCreateOpen` at the top of the component.
    - Add a primary `Button` `"Nuevo cliente"` (siesa-ui-kit `<Button type="default" size="sm">`) ABOVE the search input inside the sticky header `<div className="sticky top-0 z-10 bg-white p-3">` — render it as the first child so it stays visible regardless of list state (pending / error / empty / success).
    - Wire the button's `onClick` to `setIsCreateOpen(true)`.
    - Update the existing `EmptyState`'s `onAction` from the no-op stub to `() => setIsCreateOpen(true)` so the "no-clients" CTA also opens the dialog (currently it's a TODO comment in `ClienteListView.tsx` line 106).
    - Render `<CreateClienteDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />` inside the `<aside>` (the dialog portals out via `AlertDialog` so its DOM location doesn't matter for layout, but keeping it inside the list view keeps the component graph clear).
    - Re-export `CreateClienteDialog` from a new barrel `frontend/src/modules/crm/clientes/presentation/index.ts` IF a barrel is needed by tests; otherwise import directly.
  - [ ] DO NOT add the "Nuevo cliente" button to the right panel — the AC says it lives on the `/clientes` view; placing it inside the left-panel header is the simplest implementation that satisfies AC #4 and naturally co-locates with the list (the dialog will refresh the list cache).

- [ ] **Task 13 — Frontend: MSW handlers for the create endpoint** (AC: #6, #7, #8)
  - [ ] Edit `frontend/src/mocks/handlers/clientes.ts` and ADD:
    ```ts
    import { delay } from 'msw'

    export function createClienteSuccessHandler(fixture: ClienteFixture) {
      return [
        http.post('*/api/v1/clientes', () => HttpResponse.json(fixture, { status: 201 })),
      ]
    }

    export function createClienteValidationHandler(
      errors: Record<string, string[]> = { nombre: ['El nombre es obligatorio'] }
    ) {
      return [
        http.post('*/api/v1/clientes', () =>
          HttpResponse.json(
            {
              type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
              title: 'Datos inválidos',
              status: 400,
              instance: '/api/v1/clientes',
              errors,
            },
            { status: 400, headers: { 'Content-Type': 'application/problem+json' } }
          )
        ),
      ]
    }

    export function createClienteDuplicateNitHandler() {
      return [
        http.post('*/api/v1/clientes', () =>
          HttpResponse.json(
            {
              type: 'https://tools.ietf.org/html/rfc7231#section-6.5.8',
              title: 'NIT/RUC duplicado',
              status: 409,
              instance: '/api/v1/clientes',
              detail: 'El NIT/RUC ya está registrado',
            },
            { status: 409, headers: { 'Content-Type': 'application/problem+json' } }
          )
        ),
      ]
    }

    export function createClienteServerErrorHandler() {
      return [
        http.post('*/api/v1/clientes', () =>
          HttpResponse.json(
            { type: 'about:blank', title: 'Server Error', status: 500 },
            { status: 500 }
          )
        ),
      ]
    }

    export function createClienteSlowHandler(fixture: ClienteFixture, ms = 50) {
      return [
        http.post('*/api/v1/clientes', async () => {
          await delay(ms)
          return HttpResponse.json(fixture, { status: 201 })
        }),
      ]
    }
    ```

- [ ] **Task 14 — Frontend: Component tests for `CreateClienteDialog`** (AC: #4, #5, #6, #7, #8, #9, #10)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/CreateClienteDialog.test.tsx` covering:
    - **Form renders 4 required fields + 2 buttons (AC #4)** — assert `getByLabelText('Nombre')`, `getByLabelText('NIT/RUC')`, `getByLabelText('Teléfono')`, `getByLabelText('Ciudad')` all rendered; each has `aria-required="true"`; `getByRole('button', { name: 'Guardar' })` and `getByRole('button', { name: 'Cancelar' })` rendered.
    - **Empty submit blocks (AC #5)** — render with MSW spy on `POST /api/v1/clientes`; click "Guardar" without filling; assert four inline messages render with the exact Spanish copy; assert the POST spy was hit 0 times. Assert focus moved to the first field (Nombre).
    - **Partial fill (AC #5)** — fill only Nombre; click "Guardar"; assert 3 inline errors on the empty fields, NIT/RUC's was the next focused, POST spy = 0.
    - **Happy path 201 (AC #6 + TC-E2-P0-01 UI leg)** — render with `createClienteSuccessHandler` returning a fixture; fill all four fields with valid values; click "Guardar"; await the dialog close; assert `toast.success` was invoked with `"Cliente creado correctamente"` (spy on `toast.success` via `vi.mock('siesa-ui-kit', async () => ({ ...await vi.importActual<...>('siesa-ui-kit'), toast: { success: vi.fn(), error: vi.fn() } }))` — but ONLY mock the `toast` object, NOT the actual components which need to render). Assert TanStack Query cache for `['clientes']` was updated to include the new fixture at index 0.
    - **409 duplicate (AC #7 + TC-E2-P0-03 UI leg)** — render with `createClienteDuplicateNitHandler`; submit a valid form; assert the dialog stays open; assert inline error `"El NIT/RUC ya está registrado"` appears under the NIT/RUC input; assert NO toast was invoked; assert the rendered HTML does NOT contain `"23505"`, `"DbUpdateException"`, `"uk_clientes_nit"`, `"409"`, or `"about:blank"` (NFR6 substring scan via `container.outerHTML`).
    - **500 generic error (AC #8)** — render with `createClienteServerErrorHandler`; submit a valid form; assert dialog stays open; assert `toast.error` was invoked with `"No pudimos crear el cliente. Inténtalo de nuevo."`; assert form values are preserved (re-render the inputs and assert their values are intact).
    - **400 server-side validation (defensive — AC #8 mention)** — render with `createClienteValidationHandler({ nombre: ['Nombre inválido'] })` BUT bypass Zod by patching the resolver in this single test (or fire `mutation.mutateAsync` directly through a thin test harness) — assert `setError` was applied so the `nombre` input shows `"Nombre inválido"`. This branch is defensive; in production Zod blocks the call.
    - **Cancel button + Escape (AC #9)** — render the dialog; click "Cancelar"; assert `onClose` was invoked; reopen the dialog; assert all four input values are reset to empty. Then render again; press Escape (`user.keyboard('{Escape}')`); assert `onClose` was invoked (relies on siesa-ui-kit AlertDialog's built-in Escape handling).
    - **Submitting state disables inputs and Guardar (AC #10)** — render with `createClienteSlowHandler(fixture, 100)`; fill the form; click "Guardar"; while the mutation is in flight assert all four `<Input>` elements have `disabled` attribute, the Guardar button shows the processing state (`isProcess` flag on `AlertDialog` → confirm button shows loading text/icon — assert via `aria-busy` or the button being disabled). Click Guardar again; assert MSW handler was hit exactly ONCE.
  - [ ] Use the same `renderWithProviders` helper if it exists in the codebase (or inline a `QueryClientProvider` wrapper as in `ClienteDetailView.test.tsx`).

- [ ] **Task 15 — Frontend: Update `ClienteListView` tests** (AC: #4, #6)
  - [ ] Edit `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`:
    - Add test "renders 'Nuevo cliente' button in the sticky header regardless of list state" — render with `clienteHandlersEmpty()`, then `clienteHandlers()`, then `clienteHandlersError()` — each render asserts `getByRole('button', { name: 'Nuevo cliente' })` is in the document.
    - Add test "clicking 'Nuevo cliente' opens the CreateClienteDialog" — render with default handlers + create handler; click the button; assert the dialog content renders (`getByText('Nuevo cliente')` doubles as the dialog title; differentiate by `getByRole('dialog')`).
    - Update the existing "EmptyState 'Nuevo cliente' CTA does nothing" test (if it exists) — the CTA now opens the dialog. Update its assertion accordingly.
    - DO NOT add a test for the optimistic cache update in this file — that lives in `useCreateCliente.test.tsx` and `CreateClienteDialog.test.tsx`.

- [ ] **Task 16 — Frontend: Route-level integration test** (AC: #4, #6)
  - [ ] Create `frontend/src/routes/clientes.create.test.tsx` (NEW file — kept separate from the existing `clientes.tsx` and `clientes.$clienteId.tsx` tests so the create flow is isolated). The file is `clientes.create.test.tsx` instead of `clientes.test.tsx` to avoid overlap with whatever Story 2.1/2.2 route tests may already cover.
    - Mount a `MemoryHistory` at `/clientes`; render with default MSW handlers (`clienteHandlers()` for the list + `createClienteSuccessHandler(newFixture)` for the create endpoint).
    - Click "Nuevo cliente"; fill the 4 fields; click "Guardar".
    - Assert: dialog closes, the new client appears in the left panel's list within `findByText(newFixture.nombre)`, and the URL is still `/clientes` (no route change).
    - Add a second scenario: same flow but with `createClienteDuplicateNitHandler()`; assert the dialog stays open and shows the inline NIT/RUC error.

- [ ] **Task 17 — Frontend: ToastProvider wiring** (AC: #6, #8)
  - [ ] Verify `<ToastProvider>` is mounted in `frontend/src/routes/__root.tsx`. If absent, add it at the end of `RootLayout`'s returned JSX (inside the outermost `<div>` but outside `LayoutBase` — toasts portal to `document.body` so DOM position doesn't matter, but mounting it once near the layout root keeps the provider tree clean):
    ```tsx
    import { ToastProvider } from 'siesa-ui-kit'
    // …
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* existing NavigationRail / NavigationBar / LayoutBase tree */}
        <ToastProvider />
      </div>
    )
    ```
  - [ ] Update colocated route tests (`__root.test.tsx` and friends) only if they fail. The ToastProvider portals to the body — most tests don't need to assert on it. If a test fails because `toast.success`/`toast.error` is called without a mounted provider, render the test inside a wrapper that mounts `<ToastProvider />`.

- [ ] **Task 18 — Frontend: Build + lint + tests gate** (AC: all)
  - [ ] `pnpm exec tsc -b` from `frontend/` exits 0 (TypeScript strict, no `any`).
  - [ ] `pnpm run lint` from `frontend/` exits 0 (only pre-existing `only-export-components` warnings on TanStack route files are allowed, same baseline as Stories 2.1/2.2).
  - [ ] `pnpm test` from `frontend/` exits 0 with ALL new tests passing AND the Story 2.1 / 2.2 baseline still green (131+ tests from Story 2.2 + the new ~12-15 tests from this story).
  - [ ] `pnpm run build` from `frontend/` produces `dist/` with the main JS bundle under 500 KB gzipped (company budget — new code adds < 10 KB gzipped: 1 dialog + 1 schema + 1 hook + 2 errors).

- [ ] **Task 19 — Backend: Build + test gate** (AC: #1, #2, #3)
  - [ ] `dotnet build backend/SiesaAgents.sln` exits 0 with zero warnings.
  - [ ] `dotnet test backend/SiesaAgents.sln` — all unit and integration tests pass, including the new `CreateClienteCommandHandlerTests`, `ClienteValidatorTests`, `CreateClienteEndpointTests`, and the Story 2.1/2.2 suite remains untouched.
  - [ ] If `dotnet` CLI is unavailable in the sandbox (same constraint as Stories 2.1/2.2), document it in Completion Notes; the Testcontainer-backed integration tests still gate the contract on CI.

## Dev Notes

### Architectural placement — Clean Architecture + DDD

Story 2.3 spans **backend** (Application + API layers — Domain & Infrastructure are unchanged from Stories 2.1/2.2; `ClienteEntity.Create`, `IClienteRepository.AddAsync`, `IClienteRepository.ExistsByNitAsync`, and the `uk_clientes_nit` unique index already exist) and **frontend** (Domain + Application + Infrastructure + Presentation layers).

**Backend new/modified files** (per `architecture.md §Complete Project Directory Structure`):
- `Application/Clientes/Commands/CreateClienteCommand.cs` — NEW (sealed record carrying the 4 required fields)
- `Application/Clientes/Commands/CreateClienteCommandHandler.cs` — NEW (validate → check existing NIT → create entity → persist → return dto)
- `Application/Clientes/Exceptions/DuplicateNitException.cs` — NEW (sealed exception, carries `Nit` for logging only — message is generic)
- `Application/Clientes/Validators/ClienteValidator.cs` — NEW (FluentValidation rules with Spanish messages)
- `Application/ApplicationServiceCollectionExtensions.cs` — MODIFY (register the new handler and the validator)
- `API/Endpoints/ClienteEndpoints.cs` — MODIFY (add `MapPost("/", …)` inside the existing group with try/catch for ValidationException + DuplicateNitException)
- `tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs` — NEW
- `tests/SiesaAgents.UnitTests/Application/Clientes/ClienteValidatorTests.cs` — NEW
- `tests/SiesaAgents.IntegrationTests/Api/CreateClienteEndpointTests.cs` — NEW

**Frontend new/modified files**:
- `modules/crm/clientes/domain/errors.ts` — MODIFY (add `DuplicateNitError` and `ClienteValidationError`)
- `modules/crm/clientes/domain/IClienteRepository.ts` — MODIFY (add `create(input)` + export `CreateClienteInput`)
- `modules/crm/clientes/infrastructure/clienteApiRepository.ts` (+ test update) — MODIFY (implement `create`, map 400/409 to typed errors)
- `modules/crm/clientes/application/createClienteSchema.ts` — NEW (Zod schema + `CreateClienteFormValues` type)
- `modules/crm/clientes/application/useCreateCliente.ts` (+ test) — NEW (TanStack Query mutation hook with optimistic cache update on success)
- `modules/crm/clientes/presentation/CreateClienteDialog.tsx` (+ test) — NEW (AlertDialog + RHF + Zod + 4 Inputs)
- `modules/crm/clientes/presentation/ClienteListView.tsx` (+ test update) — MODIFY (add the "Nuevo cliente" button + wire dialog state + connect EmptyState's `onAction`)
- `mocks/handlers/clientes.ts` — MODIFY (add `createClienteSuccessHandler`, `createClienteValidationHandler`, `createClienteDuplicateNitHandler`, `createClienteServerErrorHandler`, `createClienteSlowHandler`)
- `routes/__root.tsx` — MODIFY (mount `<ToastProvider />` if absent)
- `routes/clientes.create.test.tsx` — NEW (route-level integration test)

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 mandatory) — already installed at `^1.0.245`. NO new install.
- **Required siesa-ui-kit components**: `AlertDialog` (modal container with title/confirm/cancel/loading state — verified via `node_modules/siesa-ui-kit/dist/components/AlertDialog/AlertDialog.types.d.ts`), `Input` (4 form fields with `label`, `error`, `errorMessage` props — verified via `Input.types.d.ts`), `Button` (reused — already in `EmptyState`, `ErrorPanel`, `ClienteNotFound`), `toast` + `ToastProvider` (success/error notifications — verified via `Toast/ToastProvider.d.ts`).
- **MasterCrud is NOT used in Story 2.3.** Stories 2.1/2.2 documented the architecture-level override (custom dual-panel + dedicated dialog instead of `MasterCrud`'s table+form shell); Story 2.3 inherits that decision. The create UX is a custom composition of `AlertDialog` + `Input` × 4 + `Button` × 2 — fully covered by the AlertDialog/Input primitives. No need to introduce `MasterCrud` solely for one creation form.
- **Form library**: React Hook Form (`^7.80.0`) + `@hookform/resolvers` (`^5.4.0`) for the Zod resolver — both already installed. NO new install.
- **All user-facing text in Spanish**: "Nuevo cliente", "Guardar", "Cancelar", "Nombre", "NIT/RUC", "Teléfono", "Ciudad", "El nombre es obligatorio", "El NIT/RUC es obligatorio", "El teléfono es obligatorio", "La ciudad es obligatoria", "El NIT/RUC ya está registrado", "Cliente creado correctamente", "No pudimos crear el cliente. Inténtalo de nuevo.". Code identifiers stay in English (`CreateClienteDialog`, `useCreateCliente`, `DuplicateNitError`, `ClienteValidationError`, `createClienteSchema`).
- **WCAG 2.1 AA**: `aria-required="true"` on each input; inline error messages associated with their input via `errorMessage` (siesa-ui-kit `Input` wires `aria-describedby` to the helper-text node automatically); `AlertDialog` itself provides the modal role + focus trap + Escape handler natively; the first failing field MUST receive focus after a Zod validation rejection (handled by `setFocus(firstErrorKey)` in a useEffect).

### Backend — duplicate-NIT detection strategy

Per `architecture.md §Error handling`:
- **Primary path**: `_repository.ExistsByNitAsync(command.NitRuc, ct)` runs BEFORE `AddAsync`. If true, throw `DuplicateNitException`; the endpoint maps it to a `Results.Problem(...)` with the safe Spanish detail. This is the user-visible 409 contract.
- **Fallback / safety net**: A concurrent insert race condition (two POSTs of the same NIT within the same DB round-trip window — extremely unlikely at NFR10's 10-user scale) would land at the `uk_clientes_nit` unique index and surface as a Postgres SQLSTATE `23505` → EF Core `DbUpdateException`. This falls through to the existing `ExceptionHandlingMiddleware` which returns a generic 500 Problem Details (no SQL fragments leaked). Tightening this race window with a try/catch on `SaveChangesAsync` is **out of scope** for Story 2.3; revisit only if the audit reveals real concurrent duplicates.
- **No SQL fragments in any 409 response**: TC-E2-P0-03's API leg explicitly scans the response body for `"23505"`, `"DbUpdateException"`, `"uk_clientes_nit"`, `"ClienteEntity"`, SQL fragments — these MUST be absent (NFR6 contract).

### Frontend — Optimistic cache update vs. invalidate-and-refetch

Per `architecture.md §State Boundaries` + test-design risk **R5**:
- Story 2.3 uses **direct cache update** via `queryClient.setQueryData(['clientes'], …)` in the mutation's `onSuccess`. The backend's `GET /api/v1/clientes` returns `ORDER BY created_at DESC` (verified in `ClienteRepository.GetAllAsync`), so prepending the new client at index 0 is consistent with what a refetch would yield.
- We deliberately do NOT do `queryClient.invalidateQueries({ queryKey: ['clientes'] })` because that triggers an unnecessary network round-trip and re-renders the entire list — NFR2 requires `< 2 s` UI update, and the local cache update is sub-millisecond.
- We deliberately do NOT do full **optimistic update with rollback** (write before the network completes, roll back on error). Optimistic-with-rollback is a Story 2.4 (edit) / Story 2.5 (delete) pattern per test-design TC-E2-P1-02 / TC-E2-P0-05. For Story 2.3 (create), the resource doesn't have an id until the backend assigns one, so optimistic-write-first is not a clean fit. Direct cache update on `onSuccess` is the chosen pattern; risk R5's rollback contract is therefore implicit (no optimistic write means no rollback needed).
- No retry on the mutation (`retry: false`) because `POST /api/v1/clientes` is non-idempotent — retrying could create duplicates on a transient network error.

### Form library choice — React Hook Form + Zod

Per `architecture.md §Forms` + `company-standards.md §Frontend Stack`:
- React Hook Form (`^7.80.0`) handles the controlled-input state, submission gating, and inline error rendering. Its `formState.isSubmitting` together with `mutation.isPending` is the source of truth for the disabled-while-submitting UX (AC #10).
- Zod schema is the SAME on the frontend as the FluentValidation rules on the backend (matching error messages) so the user sees the same Spanish copy regardless of which layer rejects. In practice, the client-side schema prevents 400s from being sent — the backend's 400 path is the safety net for malformed clients (e.g., a future API consumer that bypasses the React form).

### Error handling — strict NFR6 contract

- **Backend**: All four error responses (400 / 409) use Problem Details RFC 7807 via `Results.ValidationProblem(...)` / `Results.Problem(...)`. The 409's `detail` is the ONLY user-safe Spanish string emitted from the backend; the 400's `errors` map carries the FluentValidation messages (also Spanish, also user-safe). No exception type, SQL fragment, internal field name, or stack trace appears in any response body. The integration test in Task 6 includes substring scans asserting this.
- **Frontend**: The infrastructure layer (`clienteApiRepository.create`) converts 409 → `DuplicateNitError` (carries no payload — its `Error.message` is the user-safe Spanish string) and 400 → `ClienteValidationError` (carries only the field-error map). The Problem Details `type`, `instance`, and HTTP status code are dropped at the infra layer (NFR6). The UI inspects `error instanceof DuplicateNitError` / `error instanceof ClienteValidationError` to branch — never inspects raw HTTP fields. The 500 path produces a generic toast — no error object reaches the UI surface.

### Performance budget enforcement (NFR2)

NFR2 requires `< 2 s` for CRUD UI updates. The create flow's wall time is:
- Network round-trip (POST + 201 body): `< 100 ms` on local (single inserts on a UUID-PK table are dominated by EF + Postgres write latency).
- Cache update + React re-render: sub-millisecond.
- Toast show: instant.

End-to-end the user perceives `< 200 ms` from clicking "Guardar" to the new row appearing in the list — well under the 2 s budget. No explicit perf test is added for Story 2.3 (it'd be flaky and the unit cost is bounded by the same single-record write that Story 2.1 already exercises in `ClientesEndpointAtddTests`).

### Anti-patterns to avoid

```
DateTime in DTOs                              → DateTimeOffset (Story 1.3 / 2.1 contract)
PascalCase JSON                               → camelCase (default .NET serialization)
Results.Conflict() with empty body            → Results.Problem(...) with RFC 7807 + safe detail
Results.BadRequest(string)                    → Results.ValidationProblem(errors, ...) with field-keyed map
try/catch on EF SaveChangesAsync to spot 23505 → ExistsByNitAsync pre-check; 23505 falls through to 500
Leaking SQLSTATE / DbUpdateException to client → ExceptionHandlingMiddleware sanitizes everything
Spanish error messages hardcoded in C# strings → fine for MVP (no i18n on the backend)
Showing problem.title verbatim in the UI       → Show problem.detail (NIT/RUC duplicado is dev language)
Showing problem.errors / raw 400 in the UI     → setError per-field via DataclienteValidationError
Reading error.response.data anywhere in UI     → Wrapped in typed errors at the infra layer
queryClient.invalidateQueries on create        → setQueryData (NFR2 budget)
Optimistic write before backend confirms       → Direct setQueryData onSuccess (no id until server responds)
useState for the open/close flag in route file → Hoist into ClienteListView (single owner)
Retrying a non-idempotent POST                  → retry: false on the mutation
Allowing the dialog to close mid-submit         → preventCloseOnOverlayClick={isSubmitting}
Double-submit by re-clicking Guardar           → disable inputs + button via isSubmitting || mutation.isPending
Toast on the 409 branch                        → Inline error on the NIT/RUC field; no toast (UX rule)
A "Nuevo cliente" button in the right panel     → Lives in the left panel sticky header (AC #4)
MasterCrud composition                          → N/A in 2.3 — inherited override from 2.1
```

### Testing standards

- **Backend** (xUnit per `company-standards.md`):
  - Unit tests for `CreateClienteCommandHandler` (mocked repository + validator, returns-201 / duplicate-NIT / validation-failure / ct-forwarding cases).
  - Unit tests for `ClienteValidator` (FluentValidation TestHelper — required / max-length / valid cases per field).
  - Integration tests via `WebApplicationFactory<Program>` + Testcontainers Postgres 18 (201 / 400 / 400-per-field / 409 / equal timestamps + NFR6 substring scan).
  - Coverage target > 80% — the new command + endpoint should hit 100%.
- **Frontend** (Vitest + RTL + MSW + jsdom):
  - Hook tests for `useCreateCliente` (success / 409 / 400 / 500 / no-retry / cache update).
  - Repository tests in `clienteApiRepository.test.ts` for the new `create` method.
  - Component tests for `CreateClienteDialog` (8 scenarios listed in Task 14).
  - Updated `ClienteListView.test.tsx` for the new "Nuevo cliente" button.
  - Route-level integration test in `clientes.create.test.tsx`.
  - E2E (Playwright) for TC-E2-P0-03's UI leg is out of scope for the same reason as Stories 2.1/2.2 — workspace-root Playwright runner not yet wired. Component coverage gates Story 2.3.

### Test-design alignment

| TC ID | Level | AC | File(s) |
|-------|-------|-----|---------|
| TC-E2-P0-01 (API leg) | API Integration | #1 | `CreateClienteEndpointTests.cs` (`Post_ReturnsCreated201_AndPersists_WhenAllFieldsValid` + `Post_PersistsCreatedAtAndUpdatedAtEqual_OnFirstInsert`) |
| TC-E2-P0-01 (UI leg)  | Component + Route Integration | #4, #6 | `CreateClienteDialog.test.tsx` (Happy path 201) + `clientes.create.test.tsx` |
| TC-E2-P0-02 (API leg) | API Integration | #2 | `CreateClienteEndpointTests.cs` (`Post_Returns400Problem_WhenBodyIsEmpty` + `Post_Returns400_WhenSingleFieldMissing`) |
| TC-E2-P0-02 (UI leg)  | Component | #5 | `CreateClienteDialog.test.tsx` (Empty submit + Partial fill) |
| TC-E2-P0-03 (API leg) | API Integration | #3 | `CreateClienteEndpointTests.cs` (`Post_Returns409Problem_WhenNitAlreadyExists`) |
| TC-E2-P0-03 (UI leg)  | Component | #7 | `CreateClienteDialog.test.tsx` (409 duplicate) |
| TC-E2-P0-03 (E2E leg) | Playwright | #4, #7 | `e2e/tests/clientes/create-cliente-duplicate-nit.spec.ts` (when Playwright runner is wired) |
| TC-E2-P3-01           | Unit | #2, NFR5 | `ClienteValidatorTests.cs` |
| R2 (duplicate NIT)    | API + Component | #3, #7 | `CreateClienteEndpointTests.cs` + `CreateClienteDialog.test.tsx` (NFR6 substring scan) |
| R4 (required-field validation) | Component + API | #2, #5 | `CreateClienteDialog.test.tsx` + `CreateClienteEndpointTests.cs` |
| R5 (mutation rollback / no optimistic write) | Hook + Component | #6, #8 | `useCreateCliente.test.tsx` (no retry, cache update on success only) + `CreateClienteDialog.test.tsx` (500 toast, form preserved) |
| NFR6 leakage scan     | Component + API | #3, #7 | `CreateClienteDialog.test.tsx` (DOM substring scan) + `CreateClienteEndpointTests.cs` (response body substring scan) |
| NFR2 < 2 s create update | Implicit (single insert + setQueryData) | #6 | No explicit test (bounded by the same single-record write Story 2.1 already exercises) |

All Story 2.3 P0 / P3 tests scoped to the create endpoint are covered. P1/P2 cases that touch create (TC-E2-P0-01, TC-E2-P0-02, TC-E2-P0-03) are owned by this story.

### Project Structure Notes — files in scope

```
backend/
├── src/
│   ├── SiesaAgents.Application/
│   │   ├── ApplicationServiceCollectionExtensions.cs              ← MODIFY (register CreateClienteCommandHandler + ClienteValidator)
│   │   └── Clientes/
│   │       ├── Commands/
│   │       │   ├── CreateClienteCommand.cs                        ← NEW
│   │       │   └── CreateClienteCommandHandler.cs                 ← NEW
│   │       ├── Exceptions/
│   │       │   └── DuplicateNitException.cs                       ← NEW
│   │       └── Validators/
│   │           └── ClienteValidator.cs                            ← NEW
│   └── SiesaAgents.API/
│       └── Endpoints/ClienteEndpoints.cs                          ← MODIFY (add MapPost "/")
└── tests/
    ├── SiesaAgents.UnitTests/
    │   └── Application/Clientes/
    │       ├── CreateClienteCommandHandlerTests.cs                 ← NEW
    │       └── ClienteValidatorTests.cs                            ← NEW
    └── SiesaAgents.IntegrationTests/
        └── Api/CreateClienteEndpointTests.cs                        ← NEW

frontend/
├── src/
│   ├── modules/crm/clientes/
│   │   ├── domain/
│   │   │   ├── errors.ts                                           ← MODIFY (add DuplicateNitError, ClienteValidationError)
│   │   │   └── IClienteRepository.ts                              ← MODIFY (add create + CreateClienteInput)
│   │   ├── application/
│   │   │   ├── createClienteSchema.ts                              ← NEW
│   │   │   ├── useCreateCliente.ts                                 ← NEW
│   │   │   └── useCreateCliente.test.tsx                           ← NEW
│   │   ├── infrastructure/
│   │   │   ├── clienteApiRepository.ts                            ← MODIFY (implement create)
│   │   │   └── clienteApiRepository.test.ts                       ← MODIFY (add 4 test cases)
│   │   └── presentation/
│   │       ├── CreateClienteDialog.tsx                              ← NEW
│   │       ├── CreateClienteDialog.test.tsx                         ← NEW
│   │       └── ClienteListView.tsx                                  ← MODIFY (add "Nuevo cliente" button + dialog state)
│   ├── routes/
│   │   ├── __root.tsx                                              ← MODIFY (mount <ToastProvider />)
│   │   └── clientes.create.test.tsx                                ← NEW
│   └── mocks/handlers/clientes.ts                                  ← MODIFY (add 5 create handlers)
```

**Conflict check vs. existing files:**
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` was authored by Stories 2.1/2.2 with a sticky-header search input and an EmptyState `onAction` stub at line 106. Story 2.3 fills that stub and adds a "Nuevo cliente" `<Button>` ABOVE the search input inside the same sticky header. The component's public API stays parameterless.
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` is modified additively (adds `create` to the existing object literal alongside `getAll` and `getById`).
- `frontend/src/modules/crm/clientes/domain/errors.ts` is modified additively (adds two new error classes alongside the existing `ClienteNotFoundError`).
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` is modified additively (adds `create` method to the interface).
- `frontend/src/mocks/handlers/clientes.ts` is modified additively (adds 5 new factory functions for the create endpoint).
- `frontend/src/routes/__root.tsx` is modified by appending `<ToastProvider />` to the layout if it's not already there; the existing `RootLayout` shape and tests stay green.
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` is modified additively (adds one `MapPost` inside the existing `MapGroup` after the two existing `MapGet`s).
- `backend/src/SiesaAgents.Application/ApplicationServiceCollectionExtensions.cs` is modified additively (one extra `AddScoped` for the handler + one for the validator).

**Detected variance vs. architecture.md §Frontend folder structure:** Architecture references `_app/clientes/create.tsx` (pathless `_app` layout group). Stories 1.2 / 2.1 / 2.2 chose the flat layout (`clientes.tsx` at the top level) and documented the variance; Story 2.3 inherits that choice — the create flow lives inside a dialog mounted by `ClienteListView`, NOT a separate route. A future story can lift the entire `/clientes` subtree into an `_app` layout group when per-section auth boundaries (out of MVP scope) become necessary.

### References

- Epic source (Story 2.3 ACs and Epic AC-E2.1 / AC-E2.4): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.3]
- Architecture — Clean Architecture + DDD layers + endpoint patterns: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- Architecture — Complete Project Directory Structure (`Commands/`, `Validators/`, `Exceptions/`, `presentation/CreateClienteDialog.tsx`): [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- Architecture — error handling (Problem Details RFC 7807, no internal leakage): [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Identified]
- Architecture — state boundaries (TanStack Query cache as source of truth for the list): [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- Architecture — naming patterns (snake_case DB, UUID PKs, `DateTimeOffset`, camelCase JSON, FluentValidation): [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- UX spec — Create form flow + AlertDialog usage + toast wording: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Phase 3 — Detail + ContactManager]
- UX spec — Component Implementation Strategy (siesa-ui-kit AlertDialog/Input/toast → shadcn → custom): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- PRD FR1 (create with required fields): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#FR1]
- PRD FR8 (prevent saving with missing required fields): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#FR8]
- PRD FR27 (changes reflected immediately): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#FR27]
- PRD NFR2 (CRUD UI update < 2 s): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR2]
- PRD NFR5 (validate and sanitize all user inputs): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR5]
- PRD NFR6 (no internal-detail leakage): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR6]
- Test design Epic 2 — TC-E2-P0-01 / TC-E2-P0-02 / TC-E2-P0-03 / TC-E2-P3-01 / R2 / R4 / R5: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md]
- Story 2.1 baseline (list + `IClienteRepository.AddAsync` + `ExistsByNitAsync` + `uk_clientes_nit` unique index): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Story 2.2 baseline (Problem Details on GET 404 + ToastProvider may or may not be already wired): [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md]
- Company standards — Clean Architecture + DDD + stack versions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Company standards — MasterCrud API contract (NOT used in 2.3, override inherited from 2.1): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- siesa-ui-kit AlertDialog API: [Source: frontend/node_modules/siesa-ui-kit/dist/components/AlertDialog/AlertDialog.types.d.ts]
- siesa-ui-kit Input API: [Source: frontend/node_modules/siesa-ui-kit/dist/components/Input/Input.types.d.ts]
- siesa-ui-kit Toast / ToastProvider / toast API: [Source: frontend/node_modules/siesa-ui-kit/dist/components/Toast/ToastProvider.d.ts]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (BMAD create-story workflow)

### Debug Log References

### Completion Notes List

### File List
