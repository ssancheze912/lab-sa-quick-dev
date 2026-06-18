# Story 2.3: Create Client

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new client by filling in a form,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a form opens with fields: Nombre, NIT/RUC, Teléfono, Ciudad (all required per FR1).

2. **Given** the user fills all required fields and submits, **When** the form is submitted, **Then** the client is created via `POST /api/v1/clientes` and appears in the client list immediately (FR27).
   **And** a success toast shows "Cliente creado correctamente".

3. **Given** the user submits the form with one or more required fields empty, **When** the form is validated, **Then** clear inline error messages appear on the empty fields (FR8).
   **And** the form is NOT submitted to the backend.

4. **Given** the user submits a NIT/RUC that already exists in the system, **When** the backend returns a 409 conflict, **Then** an error message "El NIT/RUC ya está registrado" is displayed on the NIT field without exposing technical details (NFR6).

## Tasks / Subtasks

- [ ] Task 1 — Backend: Implement `POST /api/v1/clientes` endpoint (AC: #2, #3, #4)
  - [ ] Create `CreateClienteCommand.cs` in `backend/src/SiesaAgents.Application/Clientes/Commands/` — properties: `Nombre` (string), `Nit` (string), `Telefono` (string), `Ciudad` (string)
  - [ ] Create `CreateClienteCommandHandler.cs` in `backend/src/SiesaAgents.Application/Clientes/Commands/` — receives `CreateClienteCommand`, checks NIT uniqueness via `IClienteRepository.ExistsByNitAsync(nit, ct)`, throws `ConflictException` if duplicate, calls `ClienteEntity.Create(...)`, calls `IClienteRepository.AddAsync(entity, ct)`, returns `ClienteDto`
  - [ ] Create `CreateClienteRequest.cs` in `backend/src/SiesaAgents.Application/Clientes/DTOs/` — properties: `Nombre` (string), `Nit` (string), `Telefono` (string), `Ciudad` (string)
  - [ ] Create `CreateClienteRequestValidator.cs` in `backend/src/SiesaAgents.Application/Clientes/Validators/` — FluentValidation rules: `Nombre` NotEmpty, `Nit` NotEmpty, `Telefono` NotEmpty, `Ciudad` NotEmpty
  - [ ] Add static factory method `ClienteEntity.Create(string nombre, string nit, string telefono, string ciudad)` in `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` if not already present — sets `Id = Guid.NewGuid()`, `CreatedAt = DateTimeOffset.UtcNow`, `UpdatedAt = DateTimeOffset.UtcNow`
  - [ ] Add `ExistsByNitAsync(string nit, CancellationToken ct)` and `AddAsync(ClienteEntity entity, CancellationToken ct)` methods to `IClienteRepository.cs` in `backend/src/SiesaAgents.Domain/Clientes/Interfaces/`
  - [ ] Implement `ExistsByNitAsync` and `AddAsync` in `ClienteRepository.cs` in `backend/src/SiesaAgents.Infrastructure/Repositories/` — `ExistsByNitAsync` uses `AnyAsync(c => c.Nit == nit)`, `AddAsync` uses `_dbContext.Clientes.AddAsync` + `SaveChangesAsync`
  - [ ] Create `ConflictException.cs` in `backend/src/SiesaAgents.Domain/Exceptions/` — inherits from `Exception`, carries the conflict message
  - [ ] Add `ConflictException` catch block to `ExceptionHandlingMiddleware.cs` — maps to 409 Problem Details: `{ "status": 409, "title": "Conflict", "detail": "<message>" }`
  - [ ] Map `POST /api/v1/clientes` in `ClienteEndpoints.cs` (`backend/src/SiesaAgents.API/Endpoints/`) — validates request with `CreateClienteRequestValidator`, calls handler on valid payload, returns `201 Created` with `ClienteDto`; returns `400` on validation error; returns `409` on duplicate NIT
  - [ ] Register `CreateClienteCommandHandler` and `CreateClienteRequestValidator` in `Program.cs` DI

- [ ] Task 2 — Frontend Domain & Application layer (AC: #2, #3)
  - [ ] Add `create(data: CreateClienteData): Promise<Cliente>` to `IClienteRepository.ts` in `frontend/src/modules/crm/clientes/domain/`
  - [ ] Define `CreateClienteData` type in `frontend/src/modules/crm/clientes/domain/Cliente.ts` — `{ nombre: string; nit: string; telefono: string; ciudad: string }`
  - [ ] Implement `create` in `clienteApiRepository.ts` in `frontend/src/modules/crm/clientes/infrastructure/` — `apiClient.post<Cliente>('/api/v1/clientes', data)`
  - [ ] Create `clienteSchema.ts` in `frontend/src/modules/crm/clientes/application/` — Zod schema `clienteSchema` with `z.object({ nombre: z.string().min(1, 'Nombre es requerido'), nit: z.string().min(1, 'NIT/RUC es requerido'), telefono: z.string().min(1, 'Teléfono es requerido'), ciudad: z.string().min(1, 'Ciudad es requerida') })`. Export `ClienteFormValues` type inferred from schema.
  - [ ] Create `useCreateCliente.ts` in `frontend/src/modules/crm/clientes/application/` — TanStack Query mutation hook: `useMutation({ mutationFn: clienteApiRepository.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); toast.success('Cliente creado correctamente') }, onError: (err) => { /* handle 409 */ } })`. Export `mutate`, `isPending`, `isError`, `error`.

- [ ] Task 3 — Frontend Presentation: `ClienteForm` component (AC: #1, #2, #3, #4)
  - [ ] Create `ClienteForm.tsx` in `frontend/src/modules/crm/clientes/presentation/` — React Hook Form + Zod resolver for `clienteSchema`. Fields: Nombre, NIT/RUC, Teléfono, Ciudad. All fields render with Spanish labels and inline validation error messages below each field. Submit button labeled "Guardar". Cancel button labeled "Cancelar".
    - Uses `useCreateCliente()` mutation hook for form submission
    - On 409 error from backend, sets a field-level error on the NIT field: `setError('nit', { message: 'El NIT/RUC ya está registrado' })` using React Hook Form's `setError` — do NOT expose raw API error message
    - `data-testid="cliente-form"` on the `<form>` element
    - `data-testid="field-nombre"`, `data-testid="field-nit"`, `data-testid="field-telefono"`, `data-testid="field-ciudad"` on each input
    - `data-testid="submit-button"` on the submit button
    - `data-testid="cancel-button"` on the cancel button
    - Check siesa-ui-kit catalog first — use its form field components if available; otherwise use shadcn/ui `Input` + custom label pattern
  - [ ] Integrate the form trigger into `ClienteListView.tsx` or the `/clientes` route — add a "Nuevo cliente" button (`data-testid="nuevo-cliente-button"`) at the top of the left panel that opens `ClienteForm`. Use a Dialog/Sheet component (shadcn/ui `Dialog` or siesa-ui-kit equivalent) to host the form.
  - [ ] After successful creation, close the form dialog and ensure `ClienteListView` re-renders with the new client visible (achieved automatically via `invalidateQueries(['clientes'])`).

- [ ] Task 4 — Frontend Unit & Component Tests (AC: #1, #2, #3, #4)
  - [ ] `clienteSchema.test.ts` (co-located with `clienteSchema.ts`) — unit tests:
    - Valid payload passes validation (all 4 fields non-empty)
    - Each field individually empty → validation error with correct Spanish message
    - All fields empty → 4 validation errors
    - Injection payload `<script>alert(1)</script>` in Nombre → schema accepts (sanitization at API layer)
  - [ ] `useCreateCliente.test.ts` (co-located with `useCreateCliente.ts`) — unit tests:
    - MSW handler returns 201 with valid `ClienteDto`; assert `invalidateQueries(['clientes'])` called and toast triggered
    - MSW handler returns 409; assert error is surfaced (hook `isError = true`)
  - [ ] `ClienteForm.test.tsx` (co-located with `ClienteForm.tsx`) — component tests:
    - Renders all 4 fields with Spanish labels
    - Clicking submit with all fields empty shows 4 inline validation errors, no API call fired (MSW intercept)
    - Filling all fields and submitting: MSW returns 201; assert toast "Cliente creado correctamente" appears
    - Submitting with duplicate NIT: MSW returns 409; assert field error "El NIT/RUC ya está registrado" on NIT field
    - Clicking "Cancelar" calls the cancel handler (prop)
  - [ ] `ClienteListView.test.tsx` update (or new test block) — verify "Nuevo cliente" button renders and is clickable (opens form dialog)

- [ ] Task 5 — Backend xUnit Tests (AC: #2, #3, #4)
  - [ ] `CreateClienteTests.cs` in `backend/tests/SiesaAgents.UnitTests/Application/Clientes/`:
    - Happy path: `POST /api/v1/clientes` with valid payload → 201 Created, response contains `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` fields
    - Missing Nombre: `POST` with `Nombre=""` → 400 Problem Details, `errors.Nombre` key present
    - Missing Nit: `POST` with `Nit=""` → 400 Problem Details, `errors.Nit` key present
    - Duplicate NIT: `POST` twice with same `Nit` → second call returns 409 Problem Details, `detail` = "El NIT/RUC ya está registrado", response body has NO `stackTrace` or `exception` keys (NFR6)
    - FluentValidation missing all fields: `POST` with empty body → 400 Problem Details

## Dev Notes

### Architecture Patterns

This story introduces the **first mutation** in the Client domain. It follows Clean Architecture + DDD across all layers. The CQRS write path (`CreateClienteCommand` → `CreateClienteCommandHandler`) is symmetric with the read path established in Stories 2.1 and 2.2.

**Critical TanStack Query invalidation:** After a successful create mutation, `queryClient.invalidateQueries({ queryKey: ['clientes'] })` MUST be called in `onSuccess`. This is the key mechanism for FR27 (changes visible immediately to all users) and NFR2 (< 2s UI update). This is Risk R-202 (score 9 — highest risk in Epic 2).

**Backend note (from Story 2.1 and 2.2 dev notes):** The environment runs .NET 8 (not .NET 10). All architecture patterns remain identical. Use .NET 8-compatible NuGet package versions.

**NIT uniqueness:** The `uk_clientes_nit` unique index was created in Story 2.1's migration (`ClienteConfiguration.cs`). The backend must check uniqueness programmatically in the handler (via `ExistsByNitAsync`) to return a controlled 409 with a user-friendly Spanish message — do NOT rely on catching a PostgreSQL constraint violation and exposing its raw message (NFR6).

**ConflictException → 409:** `ExceptionHandlingMiddleware.cs` must be updated to handle `ConflictException` (new domain exception, analogous to `NotFoundException` added in Story 2.2). The 409 response body MUST follow Problem Details RFC 7807 and MUST NOT contain `stackTrace`.

**Form placement:** The "Nuevo cliente" button and `ClienteForm` dialog open within the `/clientes` route left panel. This story does NOT add a new route — it uses a Dialog/Sheet overlay within the existing split-panel layout.

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit`
- **Install**: already installed via `pnpm add siesa-ui-kit` in Story 1.1
- **Usage**: Check `siesa-ui-kit` catalog before creating any custom component. If a form field, dialog, or button component exists in siesa-ui-kit, use it.
- **Constraint**: Do not create custom components if a `siesa-ui-kit` equivalent exists.
- **MasterCrud**: NOT applicable for this story. `ClienteForm` is a focused create form, not a full CRUD data-grid orchestrator. MasterCrud applies when the entire CRUD lifecycle (list + form + delete) is orchestrated in one component — this story introduces only the Create portion.
- **Dialog**: Use shadcn/ui `Dialog` (already installed per Story 1.1 via `npx shadcn@latest add dialog`) if siesa-ui-kit does not expose a dialog/sheet overlay component.
- **Form fields**: Use shadcn/ui `Input` + `Label` pattern wrapped with React Hook Form `Controller` if no siesa-ui-kit equivalent exists.
- **Icons**: Heroicons (primary per company standards) — `import { PlusIcon } from '@heroicons/react/24/outline'` for the "Nuevo cliente" button.
- **Loading states**: show `isPending` spinner/disabled state on the submit button while mutation is in flight — disable button, show "Guardando..." label.
- **Toast library**: use whatever toast solution was established in Story 2.1 (e.g., `sonner` or the project's configured toast — do NOT introduce a new library).

### All user-facing text MUST be in Spanish

- Button to open form: `"Nuevo cliente"`
- Form title: `"Nuevo cliente"` (Dialog title)
- Field label Nombre: `"Nombre"`
- Field label NIT/RUC: `"NIT/RUC"`
- Field label Teléfono: `"Teléfono"`
- Field label Ciudad: `"Ciudad"`
- Field placeholder Nombre: `"Nombre completo o razón social"`
- Field placeholder NIT/RUC: `"Ingresa el NIT o RUC"`
- Field placeholder Teléfono: `"Número de teléfono"`
- Field placeholder Ciudad: `"Ciudad"`
- Validation error — Nombre empty: `"Nombre es requerido"`
- Validation error — NIT empty: `"NIT/RUC es requerido"`
- Validation error — NIT duplicate: `"El NIT/RUC ya está registrado"`
- Validation error — Teléfono empty: `"Teléfono es requerido"`
- Validation error — Ciudad empty: `"Ciudad es requerida"`
- Submit button: `"Guardar"`
- Submit button loading: `"Guardando..."`
- Cancel button: `"Cancelar"`
- Success toast: `"Cliente creado correctamente"`
- Generic error toast: `"No se pudo crear el cliente. Intenta de nuevo."`

### API Contract

```
POST /api/v1/clientes
  Request body (CreateClienteRequest):
  {
    "nombre": "string (required, non-empty)",
    "nit":    "string (required, non-empty)",
    "telefono": "string (required, non-empty)",
    "ciudad": "string (required, non-empty)"
  }

  Response 201 Created: ClienteDto (direct object, no wrapper)
  {
    "id": "uuid",
    "nombre": "string",
    "nit": "string",
    "telefono": "string",
    "ciudad": "string",
    "createdAt": "2026-03-12T10:30:00Z"
  }

  Response 400 Bad Request: Problem Details RFC 7807
  {
    "status": 400,
    "title": "Bad Request",
    "detail": "One or more validation errors occurred.",
    "errors": {
      "Nombre": ["Nombre es requerido"],
      "Nit": ["NIT/RUC es requerido"]
    }
  }

  Response 409 Conflict: Problem Details RFC 7807
  {
    "status": 409,
    "title": "Conflict",
    "detail": "El NIT/RUC ya está registrado"
  }
  // MUST NOT contain "stackTrace" or "exception" keys (NFR6)
```

### Frontend File Structure

New files to create:

```
frontend/src/
  modules/crm/clientes/
    domain/
      Cliente.ts                         # Add CreateClienteData type
    application/
      clienteSchema.ts                   # Zod schema + ClienteFormValues type
      clienteSchema.test.ts              # Unit tests (co-located)
      useCreateCliente.ts                # TanStack Query mutation hook
      useCreateCliente.test.ts           # Unit tests (co-located)
    presentation/
      ClienteForm.tsx                    # React Hook Form + Zod create form
      ClienteForm.test.tsx               # Component tests (co-located)
```

Files to modify:

```
frontend/src/
  modules/crm/clientes/
    domain/
      IClienteRepository.ts              # Add create(data: CreateClienteData): Promise<Cliente>
    infrastructure/
      clienteApiRepository.ts            # Implement create method (POST /api/v1/clientes)
    presentation/
      ClienteListView.tsx                # Add "Nuevo cliente" button + ClienteForm dialog integration
      ClienteListView.test.tsx (or __tests__/)  # Add test for "Nuevo cliente" button render
```

### Backend File Structure

New files to create:

```
backend/src/
  SiesaAgents.Application/Clientes/
    Commands/
      CreateClienteCommand.cs
      CreateClienteCommandHandler.cs
    DTOs/
      CreateClienteRequest.cs
    Validators/
      CreateClienteRequestValidator.cs
  SiesaAgents.Domain/
    Exceptions/
      ConflictException.cs
backend/tests/SiesaAgents.UnitTests/
  Application/Clientes/
    CreateClienteTests.cs
```

Files to modify:

```
backend/src/
  SiesaAgents.Domain/Clientes/
    Interfaces/IClienteRepository.cs     # Add ExistsByNitAsync + AddAsync
    Entities/ClienteEntity.cs            # Verify/add static Create() factory
  SiesaAgents.Infrastructure/
    Repositories/ClienteRepository.cs    # Implement ExistsByNitAsync + AddAsync
  SiesaAgents.API/
    Endpoints/ClienteEndpoints.cs        # Add POST /api/v1/clientes endpoint
    Middleware/ExceptionHandlingMiddleware.cs  # Add ConflictException → 409 mapping
    Program.cs                           # Register CreateClienteCommandHandler + Validator
```

### Backend Critical Rules

- `ClienteEntity.Id` → `Guid.NewGuid()` — never `int`, never user-supplied (NFR11)
- `CreatedAt` and `UpdatedAt` → `DateTimeOffset.UtcNow` — NEVER `DateTime` (company standard)
- NIT uniqueness check: use `ExistsByNitAsync` in the handler BEFORE calling `AddAsync`. Do NOT rely on catching a PostgreSQL `UniqueViolationException` to enforce this — that would expose implementation details (NFR6).
- 409 response body MUST NOT contain `stackTrace` or `exception` keys. The `ExceptionHandlingMiddleware` must produce a clean Problem Details RFC 7807 body for `ConflictException`.
- FluentValidation: register `CreateClienteRequestValidator` in DI and call `ValidateAsync` or use the endpoint-level inline validator before dispatching the command.
- API documentation: `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`.
- `ApplySnakeCaseNaming()` already configured in `AppDbContext.OnModelCreating()` (Story 2.1) — no manual `[Column]`/`[Table]` attributes needed.

### Risk Coverage (from test-design-epic-2.md)

| Risk | Score | Mitigation in this story |
|------|-------|--------------------------|
| R-202 — Optimistic invalidation missing | 9 | `useCreateCliente` must call `invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`. Component test verifies new client appears in list after successful form submit. E2E test verifies new client name visible in left panel within 2s. |
| R-201 — NIT/RUC duplicate not validated | 6 | Backend: `ExistsByNitAsync` check in handler + `ConflictException` → 409 with `"El NIT/RUC ya está registrado"`. API test verifies 409 + correct detail message + no `stackTrace`. Frontend: 409 response sets field error on NIT input via `setError`. |
| R-206 — Required field bypass | 2 | Zod `clienteSchema` unit test: each field empty → correct error. FluentValidation xUnit test: missing fields → 400. |
| R-204 — Input injection | 6 | Unit test: Zod accepts injection payload (sanitization at API). API test: injection payload stored as plain text, not executed. |
| R-210 — Toast in English | 1 | Component test asserts toast text = "Cliente creado correctamente" (exact match). |

### Testing Standards for This Story

Per `test-design-epic-2.md` Story 2.3 test matrix:

| Level | Count | Scenarios |
|-------|-------|-----------|
| E2E (Playwright) | 2 | Full create flow → new client in list < 2s; validation prevents submit with empty form |
| API Integration (xUnit) | 4 | POST 201 happy path; POST 400 missing Nombre; POST 400 missing NIT; POST 409 duplicate NIT |
| Component (Vitest + RTL + MSW) | 4 | Form opens with 4 fields; inline validation on empty submit; 201 → toast + list update; 409 → field error |
| Unit (Vitest) | 3 | Zod schema: all fields empty; each field empty; valid payload passes |

Test fixtures needed (reuse from Story 2.1/2.2 where possible):
- `clienteFactory()` — reuse existing fixture (single `ClienteDto` with randomized UUID, nombre, nit, telefono, ciudad)
- `createClienteRequestFactory()` — valid `CreateClienteRequest` payload: `{ nombre: 'ACME Corp', nit: '900123456-1', telefono: '6012345678', ciudad: 'Bogotá' }`
- MSW handler: `POST /api/v1/clientes → 201` with `clienteFactory()` response
- MSW handler: `POST /api/v1/clientes → 409` with Problem Details body: `{ "status": 409, "title": "Conflict", "detail": "El NIT/RUC ya está registrado" }`

### Project Structure Notes

- `ClienteListView.tsx` was created in Story 2.1 and modified in Story 2.2 (items wrapped in `<Link>`) — add "Nuevo cliente" button at the top of the panel; integrate with a Dialog that hosts `ClienteForm`. Do NOT break existing list rendering or navigation links.
- `ClienteDetailView.tsx` was created in Story 2.2 — no changes needed in this story.
- `AppDbContext.cs`, `ClienteRepository.cs`, and `ClienteEndpoints.cs` exist from Stories 2.1/2.2 — modify to add create capability.
- `NotFoundException.cs` was created in Story 2.2 — reuse as a pattern for new `ConflictException.cs`.
- `ExceptionHandlingMiddleware.cs` was updated in Story 2.2 to handle `NotFoundException → 404` — add `ConflictException → 409` in the same file, following the same pattern.
- `uk_clientes_nit` unique index already exists in the database (created in Story 2.1 migration via `ClienteConfiguration.cs`) — no new migration needed for uniqueness.
- `queryClient.ts` uses `retry: 0` (from Story 2.1 fix) — mutation errors including 409 will surface immediately.
- `shadcn/ui Dialog` is already installed (Story 1.1: `npx shadcn@latest add dialog`) — import from `@/components/ui/dialog`.

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md` — Story 2.3]
- Architecture decisions (mutation pattern, query invalidation, API contract, file structure): [Source: `_bmad-output/planning-artifacts/architecture.md` — API & Communication Patterns, Process Patterns, Complete Project Directory Structure]
- Company standards (stack, folder structure, naming, rules): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]
- Test design matrix and risks for Story 2.3: [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — Story 2.3, Risk Matrix R-202, R-201, R-204, R-206, R-210]
- Previous story learnings (Story 2.2): [Source: `_bmad-output/implementation-artifacts/2-2-client-detail-view.md` — Dev Notes (NotFoundException pattern, .NET 8 env), Completion Notes List, Debug Log References]
- Previous story learnings (Story 2.1): [Source: `_bmad-output/implementation-artifacts/2-1-client-list-search.md` — Dev Notes (uk_clientes_nit, ClienteEntity.Create factory, AppDbContext setup)]
- MasterCrud reference: [Source: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`] — NOT applicable to this story (single focused create form, not a full CRUD orchestrator screen)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
