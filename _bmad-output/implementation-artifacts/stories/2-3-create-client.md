# Story 2.3: Create Client

Status: review

## Story

As a commercial team member,
I want to register a new client by filling in a form,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a dialog form opens with four fields: Nombre, NIT/RUC, Teléfono, Ciudad — all marked as required (FR1).

2. **Given** the user fills all required fields and clicks "Guardar", **When** the form is submitted, **Then** the client is created via `POST /api/v1/clientes`, the dialog closes, the new client appears in the left panel list immediately without a page reload (FR27), and a toast displays "Cliente creado correctamente".

3. **Given** the user clicks "Guardar" with one or more required fields empty, **When** the Zod schema validation runs on submit, **Then** inline error messages appear under each empty field (FR8), the form does NOT send any request to the backend, and the dialog remains open.

4. **Given** the user submits a NIT/RUC that already exists, **When** the backend returns HTTP 409, **Then** an inline error message "El NIT/RUC ya está registrado" appears in the form without exposing technical details (NFR6), and the dialog remains open.

## Tasks / Subtasks

- [x] Task 1 — Frontend: create `clienteSchema.ts` Zod validation schema (AC: 1, 3)
  - [x] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
  - [x] Schema fields: `nombre` (string, min 1, max 200), `nit` (string, min 1, max 50), `telefono` (string, min 1, max 50), `ciudad` (string, min 1, max 100)
  - [x] All fields required — Spanish error messages matching company standard
  - [x] Export `ClienteFormValues` type inferred from schema

- [x] Task 2 — Frontend: create `useCreateCliente` mutation hook (AC: 2, 4)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
  - [x] Use `useMutation` with `mutationFn: (data: ClienteFormValues) => clienteApiRepository.create(data)`
  - [x] `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })`, then `toast.success('Cliente creado correctamente')`
  - [x] Return mutation object including `isPending` and `error`
  - [x] Add `create(data: CreateClientePayload): Promise<Cliente>` to `IClienteRepository` interface
  - [x] Implement `create()` in `clienteApiRepository.ts` — `POST /api/v1/clientes`, return typed `Cliente`

- [x] Task 3 — Frontend: create `ClienteFormDialog` component (AC: 1, 2, 3, 4)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteFormDialog.tsx`
  - [x] Use Radix UI `Dialog` (Dialog.Root/Content/Portal/Overlay)
  - [x] Form powered by React Hook Form + Zod resolver (`clienteSchema`)
  - [x] Fields: Nombre, NIT/RUC, Teléfono, Ciudad — each with `<label>`, `<input>`, and inline error `<p role="alert">`
  - [x] Footer buttons: "Cancelar" (closes dialog, resets form) and "Guardar" (submits)
  - [x] "Guardar" button shows loading state while `isPending` is true (`disabled` + "Guardando..." text)
  - [x] On HTTP 409 from `useCreateCliente` error, set field-level error on `nit` field: "El NIT/RUC ya está registrado" via `setError('nit', ...)`
  - [x] Dialog auto-closes on successful creation
  - [x] `data-testid="cliente-form-dialog"` on `DialogContent`
  - [x] `data-testid="input-nombre|input-nit|input-telefono|input-ciudad"` on each input
  - [x] `data-testid="btn-guardar"` on submit button; `data-testid="btn-cancelar"` on cancel button
  - [x] `data-testid="error-nit"` on the NIT/RUC inline error element
  - [x] All labels and placeholders in Spanish; WCAG 2.1 AA — inputs linked to labels via `htmlFor`/`id`

- [x] Task 4 — Frontend: add "Nuevo cliente" button to `ClienteListPanel` (AC: 1)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
  - [x] Add a "Nuevo cliente" button at the top of the panel
  - [x] Button click opens `ClienteFormDialog` (control open state with `useState<boolean>`)
  - [x] `data-testid="btn-nuevo-cliente"` on the button
  - [x] Siesa Blue `#0e79fd` as primary color

- [x] Task 5 — Backend: wire POST endpoint with 409 conflict handling (AC: 2, 4)
  - [x] Created `backend/src/SiesaAgents.Domain/Exceptions/ConflictException.cs`
  - [x] Created `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteCommandValidator.cs`
  - [x] Updated `CreateClienteCommandHandler` to use FluentValidation
  - [x] Updated `ClienteRepository.CreateAsync` to catch PostgreSQL error 23505 → throw `ConflictException`
  - [x] Updated `ExceptionHandlingMiddleware` to map `ConflictException` → 409, `ValidationException` → 400 with detail

- [x] Task 6 — Write E2E tests (AC: 1, 2, 3, 4)
  - [x] Created `e2e/tests/clientes/clientes-create.spec.ts`
    - E2E-C-11 (P0): PASS
    - E2E-C-12 (P0): PASS
    - E2E-C-13 (P0): PASS
    - E2E-C-14 (P0): PASS
    - E2E-C-15 (P0): PASS
    - E2E-C-16 (P1): PASS
    - E2E-C-17 (P1): PASS

- [x] Task 7 — Write API integration tests (AC: 2, 4)
  - [x] Created in `e2e/tests/clientes/clientes-create.spec.ts`
    - API-C-01 (P0): PASS
    - API-C-02 (P0): PASS
    - API-C-03 (P0): PASS

- [x] Task 8 — Write backend unit tests (AC: 3, 4)
  - [x] Created `backend/tests/SiesaAgents.UnitTests/Validators/ClienteValidatorTests.cs`
    - UNIT-B-01 (P1): PASS
    - UNIT-B-02 (P1): PASS
    - UNIT-B-03 (P1): PASS
  - [x] Created `backend/tests/SiesaAgents.UnitTests/Handlers/ClienteHandlerTests.cs`
    - UNIT-B-04 (P1): PASS
    - UNIT-B-05 (P1): PASS

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- toast implemented via custom Zustand store (`toastStore.ts`) + `ToastContainer` component since sonner/react-toastify not in dependencies
- Dialog implemented with `@radix-ui/react-dialog` (already installed via pnpm)
- All 10 E2E tests GREEN; all 5 backend unit tests GREEN

### File List

**Created:**
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteFormDialog.tsx`
- `frontend/src/shared/lib/toastStore.ts`
- `frontend/src/shared/components/ToastContainer.tsx`
- `backend/src/SiesaAgents.Domain/Exceptions/ConflictException.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteCommandValidator.cs`
- `backend/tests/SiesaAgents.UnitTests/Validators/ClienteValidatorTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Handlers/ClienteHandlerTests.cs`
- `e2e/tests/clientes/clientes-create.spec.ts`

**Modified:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
- `frontend/src/routes/__root.tsx`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
