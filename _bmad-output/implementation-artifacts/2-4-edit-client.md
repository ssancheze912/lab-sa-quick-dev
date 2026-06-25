# Story 2.4: Edit Client

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit any field of an existing client,
So that the client information stays up to date.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** the user clicks "Editar", **Then** the client form opens pre-filled with the current values of all fields: Nombre, NIT/RUC, Teléfono, Ciudad (FR6).

2. **Given** the user modifies one or more fields and submits, **When** the backend returns 200 OK, **Then** the changes are reflected in the client detail and list immediately (TanStack Query `invalidateQueries(['clientes'])` and `invalidateQueries(['clientes', id])` — FR27), **And** a success toast is displayed with the message "Cliente actualizado correctamente", **And** the form is closed.

3. **Given** the user clears a required field and submits, **When** client-side Zod validation runs, **Then** clear inline error messages appear below each empty field in Spanish (e.g., "El nombre es requerido"), **And** the form is NOT submitted to the backend (FR8).

4. **Given** the user clicks "Cancelar" without saving, **When** the form closes, **Then** the original client data remains unchanged and no request is sent.

5. **Given** the backend is unavailable when the form is submitted (network error or 5xx), **When** the mutation fails, **Then** a toast error is displayed with the message "No se pudo actualizar el cliente. Intenta de nuevo.", **And** the form remains open with all entered data preserved.

6. **Given** the user submits a NIT/RUC that already belongs to a different client, **When** the backend returns 409 Conflict, **Then** an inline error message "El NIT/RUC ya está registrado" appears on the NIT/RUC field (NFR6), **And** the form remains open.

## Tasks / Subtasks

- [x] Task 1 — Backend: Implement `PUT /api/v1/clientes/{id}` command, validator, and endpoint (AC: #2, #5, #6)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`: `record UpdateClienteCommand(Guid Id, string Nombre, string Nit, string Telefono, string Ciudad)`.
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`: accepts `UpdateClienteCommand`, calls `IClienteRepository.GetByIdAsync(id)` → if null returns null (endpoint sends 404), updates entity fields, calls `IClienteRepository.UpdateAsync(entity)`, returns `ClienteDto`. Throws or propagates `DbUpdateException` for duplicate NIT (middleware maps to 409).
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandValidator.cs` (FluentValidation): validate `Id` not empty, `Nombre`, `Nit`, `Telefono`, `Ciudad` not empty/whitespace, max length 200 chars each. Validation errors return 400 Problem Details.
  - [x] Update `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`: add `Task<ClienteEntity> UpdateAsync(ClienteEntity entity)`.
  - [x] Update `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`: implement `UpdateAsync` — retrieve tracked entity (or attach), update fields, set `UpdatedAt = DateTimeOffset.UtcNow`, call `SaveChangesAsync()`. Let `DbUpdateException` with unique-constraint violation propagate so middleware can map it to 409.
  - [x] Update `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`: map `PUT /api/v1/clientes/{id:guid}` → validates input via `UpdateClienteCommandValidator`, calls `UpdateClienteCommandHandler`, returns `200 OK` with `ClienteDto` on success, `404 Not Found` Problem Details if client not found.
  - [x] `ExceptionHandlingMiddleware.cs`: verify that the existing 409 branch (added in Story 2.3 for `23505` PostgreSQL code) also covers the UPDATE path — no additional change needed if middleware is global; confirmed and documented.
  - [x] Register `UpdateClienteCommandHandler` and `UpdateClienteCommandValidator` in `backend/src/SiesaAgents.API/Program.cs`.

- [x] Task 2 — Backend: Write unit and integration tests for `UpdateCliente` (AC: #2, #3, #5, #6)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`:
    - Test: handler updates entity and returns updated `ClienteDto` on valid input.
    - Test: handler returns null when client ID does not exist.
    - Test: handler propagates `DbUpdateException` for duplicate NIT (middleware maps to 409).
    - Test: validator rejects empty `Nombre`, `Nit`, `Telefono`, `Ciudad`.
    - Test: validator rejects fields exceeding max length (200 chars).
  - [x] Extend `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`:
    - Test `PUT /api/v1/clientes/{id}` returns `200 OK` with updated `ClienteDto` on valid payload.
    - Test `PUT /api/v1/clientes/{id}` returns `400 Bad Request` (Problem Details) when required fields are empty.
    - Test `PUT /api/v1/clientes/{id}` returns `404 Not Found` when client ID does not exist.
    - Test `PUT /api/v1/clientes/{id}` returns `409 Conflict`: covered at unit level (InMemory EF does not enforce unique constraints).
    - Test response is `application/json` with camelCase fields and updated `updatedAt` timestamp.
    - Test: updated client reflects new values when calling `GET /api/v1/clientes/{id}` after successful update.
  - [x] Update fake repository implementations in all existing unit test files (`GetClientesQueryHandlerTests.cs`, `GetClienteByIdQueryHandlerTests.cs`, `CreateClienteCommandHandlerTests.cs`) to implement the new `UpdateAsync` method.

- [x] Task 3 — Frontend: Extend Zod schema with update variant (AC: #1, #3)
  - [x] Update `frontend/src/modules/crm/clientes/application/clienteSchema.ts`: add `updateClienteSchema` (same shape as `createClienteSchema`) and `UpdateClienteData` type:
    ```typescript
    export const updateClienteSchema = z.object({
      nombre: z.string().min(1, 'El nombre es requerido').max(200),
      nit: z.string().min(1, 'El NIT/RUC es requerido').max(200),
      telefono: z.string().min(1, 'El teléfono es requerido').max(200),
      ciudad: z.string().min(1, 'La ciudad es requerida').max(200),
    });
    export type UpdateClienteData = z.infer<typeof updateClienteSchema>;
    ```

- [x] Task 4 — Frontend: Extend infrastructure layer for update (AC: #2, #5, #6)
  - [x] Update `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`: add `update(id: string, data: UpdateClienteData): Promise<Cliente>`.
  - [x] Update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: add `update` method:
    ```typescript
    update: async (id: string, data: UpdateClienteData) => {
      const { data: updated } = await apiClient.put<Cliente>(`/api/v1/clientes/${id}`, data);
      return updated;
    },
    ```

- [x] Task 5 — Frontend: Implement `useUpdateCliente` mutation hook (AC: #2, #5, #6)
  - [x] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`:
    ```typescript
    import { useMutation, useQueryClient } from '@tanstack/react-query';
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository';
    import type { UpdateClienteData } from './clienteSchema';

    export function useUpdateCliente(clienteId: string) {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data: UpdateClienteData) => clienteApiRepository.update(clienteId, data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['clientes'] });
          queryClient.invalidateQueries({ queryKey: ['clientes', clienteId] });
        },
      });
    }
    ```
  - Note: Toast notifications and 409 error mapping are handled in the presentation layer to keep the hook generic.

- [x] Task 6 — Frontend: Adapt `ClienteForm` to support edit mode (AC: #1, #2, #3, #4, #5, #6)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` to accept an optional `initialData` prop and `mode: 'create' | 'edit'`:
    ```typescript
    interface ClienteFormProps {
      mode: 'create' | 'edit';
      initialData?: Pick<Cliente, 'nombre' | 'nit' | 'telefono' | 'ciudad'>;
      onSuccess: () => void;
      onCancel: () => void;
    }
    ```
  - When `mode === 'edit'` and `initialData` is provided: pre-fill all form fields with `defaultValues` from `initialData` via React Hook Form (`useForm({ defaultValues: initialData })`).
  - Submit button label: "Guardar cambios" in edit mode, "Crear cliente" in create mode.
  - On submit in edit mode: call `useUpdateCliente` mutation instead of `useCreateCliente`.
  - On 409 conflict (edit): `setError('nit', { type: 'server', message: 'El NIT/RUC ya está registrado' })` — inline on NIT field.
  - On other errors (5xx / network) in edit mode: show toast error "No se pudo actualizar el cliente. Intenta de nuevo."
  - On submit success in edit mode: show toast "Cliente actualizado correctamente", call `onSuccess()`.
  - "Cancelar" button calls `onCancel()` in both modes — no request sent.
  - Loading state: disable submit button and show "Guardando…" while mutation is `isPending`.
  - Keep existing `createClienteSchema` for create mode; use `updateClienteSchema` for edit mode.
  - WCAG 2.1 AA: maintain existing `<label>` with `htmlFor`/`id`, `aria-describedby`, `aria-invalid`, `aria-label` on buttons. Update form `aria-label` to "Editar cliente" in edit mode.

- [x] Task 7 — Frontend: Add "Editar" button and edit flow to `ClienteDetailPanel` (AC: #1, #2, #4)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`:
    - Add local `useState<boolean>` `isEditing` (default `false`).
    - Render an "Editar" button (Siesa Blue `#0e79fd`) in the detail panel header when a client is loaded.
    - When `isEditing` is `true`, render `ClienteForm` with `mode="edit"` and `initialData` from the loaded `ClienteDto` (all four fields: nombre, nit, telefono, ciudad).
    - `onSuccess={() => setIsEditing(false)}` — closes form after successful update; the `invalidateQueries` in the hook triggers automatic data refresh.
    - `onCancel={() => setIsEditing(false)}` — closes form, original data unchanged.
    - When `isEditing` is `false`, render the existing detail view (`<dl>` with field values).
    - The "Editar" button must NOT render while in skeleton/loading state or error/404 state.

- [x] Task 8 — Frontend: Write unit and component tests (AC: #1, #2, #3, #4, #5, #6)
  - [x] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts`:
    - Mock `clienteApiRepository.update` with MSW.
    - Test: mutation calls `PUT /api/v1/clientes/{id}` with correct payload.
    - Test: on success, `invalidateQueries(['clientes'])` and `invalidateQueries(['clientes', id])` are called.
    - Test: on 409, mutation `isError` is true with status 409.
    - Test: on 5xx, mutation `isError` is true.
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx` with new edit-mode tests:
    - Test: form fields are pre-filled when `initialData` prop is provided and `mode='edit'`.
    - Test: submit button label is "Guardar cambios" in edit mode.
    - Test: submitting empty required field in edit mode shows inline error, no API call made.
    - Test: submitting valid edit form calls `PUT /api/v1/clientes/{id}` and fires `onSuccess`.
    - Test: submit button disabled and shows "Guardando…" while edit mutation is pending.
    - Test: 409 response in edit mode sets inline NIT error "El NIT/RUC ya está registrado".
    - Test: 5xx response in edit mode shows toast error "No se pudo actualizar el cliente. Intenta de nuevo."
    - Test: "Cancelar" button calls `onCancel`, no API call made.
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx`:
    - Test: "Editar" button renders when client data is loaded.
    - Test: "Editar" button is NOT present during skeleton loading state.
    - Test: clicking "Editar" shows `ClienteForm` with `mode='edit'` and pre-filled data.
    - Test: clicking "Cancelar" in edit form hides the form and shows the detail view again.
    - Test: after successful edit, `onSuccess` is called and detail view is shown again.
    - Note: axe accessibility check skipped — `@axe-core/react` not installed in project.

## Dev Notes

### Architecture Alignment

This story covers the **write path (update)** for the `clientes` module (FR6, FR27). It adds:
- New backend command: `PUT /api/v1/clientes/{id}` (CQRS Command + Handler + FluentValidation Validator)
- New frontend mutation hook: `useUpdateCliente` (TanStack Query `useMutation`)
- Extension of `clienteSchema.ts` with `updateClienteSchema`
- Adaptation of `ClienteForm.tsx` to support both create and edit modes
- Extension of `ClienteDetailPanel.tsx` with "Editar" button and inline form toggle
- Extension of `IClienteRepository` (domain + infrastructure) with `UpdateAsync` / `update`

Clean Architecture layers for frontend (`src/modules/crm/clientes/`):
- **Domain**: `IClienteRepository.ts` (add `update`)
- **Application**: `clienteSchema.ts` (add `updateClienteSchema`), `useUpdateCliente.ts` (new mutation hook)
- **Infrastructure**: `clienteApiRepository.ts` (add `update` method)
- **Presentation**: `ClienteForm.tsx` (extend with edit mode), `ClienteDetailPanel.tsx` (add "Editar" button + form toggle)

Backend layers:
- **Domain**: `IClienteRepository.cs` (add `UpdateAsync`)
- **Application**: `UpdateClienteCommand.cs`, `UpdateClienteCommandHandler.cs`, `UpdateClienteCommandValidator.cs`
- **Infrastructure**: `ClienteRepository.cs` (implement `UpdateAsync`)
- **API**: `ClienteEndpoints.cs` (add `PUT /api/v1/clientes/{id:guid}`)
- **Program.cs**: register `UpdateClienteCommandHandler` and `UpdateClienteCommandValidator`

### MasterCrud Note

This story does NOT use MasterCrud. The edit flow is a **custom form embedded in the split-panel layout** (`ClienteForm.tsx` in `ClienteDetailPanel.tsx`). MasterCrud applies to standard table-based CRUD orchestration screens; this feature uses an inline/right-panel form pattern consistent with Stories 2.2 and 2.3.

### State Management

- **Mutation state**: TanStack Query `useMutation` in `useUpdateCliente` — `isPending`, `isError`, `error` exposed to `ClienteForm` in edit mode.
- **Form state**: React Hook Form — field values, dirty state, validation errors. `defaultValues` populated from `initialData` prop.
- **List + detail cache invalidation**: on `onSuccess`, `invalidateQueries({ queryKey: ['clientes'] })` AND `invalidateQueries({ queryKey: ['clientes', clienteId] })` → changes immediately visible in both left panel list and right panel detail (FR27).
- **Edit toggle**: local `useState<boolean>` `isEditing` in `ClienteDetailPanel`. URL does NOT change when edit form opens.

### 409 Conflict Handling (NFR6)

The existing 409 branch in `ExceptionHandlingMiddleware.cs` (added in Story 2.3) already handles PostgreSQL error code `23505` (unique constraint on `uk_clientes_nit`). No new middleware branch needed — verify that the global middleware covers the PUT path.

Frontend detection in `ClienteForm.tsx` (edit mode):
```typescript
import type { AxiosError } from 'axios';

const handleSubmitError = (error: unknown) => {
  const axiosError = error as AxiosError<{ status: number }>;
  if (axiosError.response?.status === 409) {
    setError('nit', { type: 'server', message: 'El NIT/RUC ya está registrado' });
  } else {
    toast.error('No se pudo actualizar el cliente. Intenta de nuevo.');
  }
};
```

### API Contract

```
PUT /api/v1/clientes/{id}
Content-Type: application/json

Request body:
{
  "nombre": "Empresa Actualizada S.A.",
  "nit": "900123456-7",
  "telefono": "6019876543",
  "ciudad": "Medellín"
}

Response 200 OK — Content-Type: application/json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Empresa Actualizada S.A.",
  "nit": "900123456-7",
  "telefono": "6019876543",
  "ciudad": "Medellín",
  "createdAt": "2026-06-25T10:30:00Z",
  "updatedAt": "2026-06-25T11:00:00Z"
}

Response 400 Bad Request — Problem Details RFC 7807 (FluentValidation failure)
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Bad Request",
  "status": 400,
  "errors": {
    "Nombre": ["'Nombre' must not be empty."],
    "Nit": ["'Nit' must not be empty."]
  }
}

Response 404 Not Found — Problem Details RFC 7807
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Not Found",
  "status": 404,
  "detail": "Cliente con id 550e8400-e29b-41d4-a716-446655440000 no encontrado."
}

Response 409 Conflict — Problem Details RFC 7807 (duplicate NIT)
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Conflict",
  "status": 409,
  "detail": "El NIT/RUC ya está registrado."
}

Response 500 — Problem Details RFC 7807 (via ExceptionHandlingMiddleware)
```

### UI Implementation Requirements (MANDATORY)

- **siesa-ui-kit first**: check siesa-ui-kit catalog before creating any custom UI components. Confirmed from Stories 2.1–2.3: `EmptyState` and `ErrorPanel` are NOT in siesa-ui-kit — use existing custom components at `frontend/src/shared/components/`.
- **Form library**: React Hook Form + Zod resolver (already installed). Use `useForm({ defaultValues: initialData })` for pre-filling edit mode.
- **Toast**: use the existing toast integration from Story 2.3 (`siesa-ui-kit` toast with `ToastProvider` in `main.tsx`). Show `toast.success('Cliente actualizado correctamente')` / `toast.error(...)`.
- **Brand colors**: "Editar" button primary → `#0e79fd` (Siesa Blue). Form uses Tailwind `slate-*` for labels, `red-500` / `red-600` for inline validation errors.
- **Loading state**: disable submit button and change label to "Guardando…" while `isPending` — NOT a spinner.
- **Typography**: Inter font classes — `font-light` (300), `font-normal` (400), `font-bold` (700).
- All user-facing text MUST be in Spanish: labels, placeholders, error messages, button text, ARIA labels.
- Code (variables, functions, types) in English.
- WCAG 2.1 AA: each `<input>` has associated `<label>` via `htmlFor`/`id`, inline errors linked via `aria-describedby`, keyboard-navigable form, focus visible rings. Form `aria-label` should be "Editar cliente" in edit mode.

### Backend Enforcement Rules (Mandatory)

- `ClienteEntity.Id`: `Guid` (UUID) — `UpdateAsync` parameter is `ClienteEntity` with existing `Guid Id`.
- `UpdatedAt`: `DateTimeOffset.UtcNow` — set at the point of update inside handler or repository. NEVER `DateTime`.
- `PUT /api/v1/clientes/{id}` returns `200 OK` with updated `ClienteDto` — NOT `204 No Content`.
- `404 Not Found` when the provided `id` does not match any `ClienteEntity` in the database — return `Results.Problem(statusCode: 404)` or `Results.NotFound()`.
- `ExceptionHandlingMiddleware` already handles the `23505` 409 branch from Story 2.3 — confirm coverage for PUT path (no new branch needed).
- `FluentValidation` validator must be invoked at the endpoint level (consistent with Story 2.3 approach).
- API documentation: Scalar at `/scalar` — do NOT add Swagger.
- `uk_clientes_nit` unique index already exists from Story 2.1 migration — no new migration needed.

### Previous Story Learnings

1. `siesa-ui-kit` has `toast` and `ToastProvider` — already wired in `main.tsx` from Story 2.3. Use `toast.success(...)` / `toast.error(...)` directly.
2. `@/` path alias is configured in `vite.config.ts` and `tsconfig.json` — use it for all imports.
3. `ExceptionHandlingMiddleware` is already wired in `Program.cs` from Story 1.3 — do NOT re-register. The 409 branch for `23505` was added in Story 2.3 — verify it covers PUT requests globally.
4. `AppDbContext.Clientes` DbSet and `uk_clientes_nit` unique index already exist — no new migration needed.
5. `IClienteRepository` returns `ClienteEntity` (not `ClienteDto`) from domain layer; Application layer performs the projection to `ClienteDto`.
6. Integration tests use per-test `InMemoryClienteFactory` instances with unique DB names to prevent data leakage — follow the same pattern for PUT tests.
7. `ExceptionHandlingMiddleware.WriteAsJsonAsync` workaround from Story 2.1: use `JsonSerializer.Serialize` + `WriteAsync` to control `Content-Type: application/problem+json` explicitly.
8. Fake repository implementations in unit test files (now three: `GetClientesQueryHandlerTests.cs`, `GetClienteByIdQueryHandlerTests.cs`, `CreateClienteCommandHandlerTests.cs`) must be updated to implement the new `UpdateAsync` method.
9. `ClienteListPanel` already accepts `activeClienteId` and `onClienteSelect` from Story 2.2 refactor.
10. `ClienteForm.tsx` was created in Story 2.3 with `create` mode only — this story extends it to support both modes. Avoid duplicating the component; adapt the existing one.
11. Axe accessibility check not included in tests — `@axe-core/react` is not installed. WCAG 2.1 AA compliance is enforced structurally.

### Git History Context

Recent commits confirm Stories 2.1, 2.2, and 2.3 are complete:
- `ClienteEntity`, `ClienteDto`, `IClienteRepository` (with `GetAllAsync`, `GetByIdAsync`, `CreateAsync`), `ClienteRepository`, `ClienteEndpoints` with GET + POST endpoints, `useClientes`, `useCliente`, `useCreateCliente`, `ClienteListPanel`, `ClienteDetailPanel`, `ClienteForm`, `EmptyState`, `ErrorPanel`, `clientes.tsx`, `clientes.$clienteId.tsx` — all in place.
- `ToastProvider` wired in `main.tsx` from Story 2.3.
- Test infrastructure (MSW, Vitest, RTL, xUnit, integration tests) is operational.
- `@/` alias, `apiClient.ts`, `AppDbContext` with `ApplySnakeCaseNaming()` are configured.
- `ExceptionHandlingMiddleware` with 409 branch for `23505` is wired and operational.

### Project Structure Notes

Files to create or modify in this story:

**Backend — new:**
```
backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs
backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs
backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandValidator.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs
```

**Backend — modify:**
```
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs              ← add UpdateAsync
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs               ← implement UpdateAsync
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs                              ← add PUT /api/v1/clientes/{id:guid}
backend/src/SiesaAgents.API/Program.cs                                                 ← register UpdateClienteCommandHandler + Validator
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs    ← add UpdateAsync to fake
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs ← add UpdateAsync to fake
backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs ← add UpdateAsync to fake
backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs                    ← extend with PUT tests
```

**Frontend — new:**
```
frontend/src/modules/crm/clientes/application/useUpdateCliente.ts
frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts
```

**Frontend — modify:**
```
frontend/src/modules/crm/clientes/application/clienteSchema.ts                       ← add updateClienteSchema
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts                        ← add update method
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts              ← add update method
frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx                         ← extend with edit mode (initialData + mode prop)
frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx                    ← add edit-mode tests
frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx                  ← add "Editar" button + isEditing toggle
frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx             ← add edit flow tests
```

### References

- FR6 (Editar cliente: todos los campos) [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.4`]
- FR27 (Cambios inmediatos para todos los usuarios → `invalidateQueries`) [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements Overview`]
- FR8 (Validación frontend: Zod inline errors) [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Acceptance Criteria`]
- NFR5 (Validación: FluentValidation backend + Zod frontend) [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements Overview`]
- NFR6 (Sin stack traces al usuario → Problem Details RFC 7807) [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements Overview`]
- AC-E2.3 (Ver detalle, editar cualquier campo y guardar cambios) [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Acceptance Criteria (QA Validation)`]
- `PUT /api/v1/clientes/{id}` endpoint contract [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- TanStack Query mandatory invalidation pattern (both `['clientes']` and `['clientes', id]`) [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- Problem Details RFC 7807 for error responses [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`]
- FluentValidation for backend validation [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack`]
- React Hook Form + Zod for frontend forms [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack`]
- MasterCrud reference (not applicable for inline form) [Source: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`]
- siesa-ui-kit mandatory (no EmptyState/ErrorPanel in kit; toast available) [Source: Story 2.3 Completion Notes]
- `uk_clientes_nit` unique index from Story 2.1 migration (no new migration) [Source: `_bmad-output/implementation-artifacts/2-3-create-client.md#Backend Enforcement Rules`]
- `ExceptionHandlingMiddleware` 409 branch wired from Story 2.3 [Source: `_bmad-output/implementation-artifacts/2-3-create-client.md#Completion Notes List`]
- `ExceptionHandlingMiddleware` workaround (WriteAsync + JsonSerializer) [Source: Story 2.1 Completion Notes]
- Company standards: DateTimeOffset, UUID PKs, snake_case DB, Scalar, Problem Details [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]
- `useCliente` hook with queryKey `['clientes', id]` (Story 2.2) [Source: `_bmad-output/implementation-artifacts/2-2-client-detail-view.md`]
- `ClienteForm.tsx` created in Story 2.3 with create-only mode [Source: `_bmad-output/implementation-artifacts/2-3-create-client.md#Project Structure Notes`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

1. `UpdateClienteCommand` uses a separate `UpdateClienteBody` record for endpoint binding (no `Id` in JSON body — `Id` comes from route param). This keeps the API contract clean and avoids ambiguous model binding.
2. `ClienteEntity.Update()` method added to the domain entity to encapsulate field mutation and `UpdatedAt = DateTimeOffset.UtcNow` update.
3. `ExceptionHandlingMiddleware` 409 branch confirmed to be global — covers PUT path without modification.
4. Frontend `ClienteForm.tsx` uses discriminated union props (`ClienteFormCreateProps | ClienteFormEditProps`) for type-safe mode-specific prop enforcement.
5. `useUpdateCliente` hook kept generic (no toast); toast notifications handled in `ClienteForm.tsx` presentation layer.
6. All 47 backend unit tests + 23 integration tests passing (70 total). All 133 frontend tests passing.
7. Fake repository implementations in all three existing unit test files updated with `UpdateAsync` stub.

### File List

**Backend — new:**
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandValidator.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`

**Backend — modified:**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — added `Update()` method
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — added `UpdateAsync`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implemented `UpdateAsync`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — added `PUT /api/v1/clientes/{id:guid}` + `UpdateClienteBody` record
- `backend/src/SiesaAgents.API/Program.cs` — registered `UpdateClienteCommandHandler` + `UpdateClienteCommandValidator`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` — added `UpdateAsync` to fake
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` — added `UpdateAsync` to fake
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs` — added `UpdateAsync` to fake
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — extended with 5 PUT tests

**Frontend — new:**
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts`

**Frontend — modified:**
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts` — added `updateClienteSchema` + `UpdateClienteData`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — added `update` method
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — added `update` method
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` — extended with edit mode
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx` — added edit-mode tests
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx` — added "Editar" button + `isEditing` toggle
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx` — added edit flow tests
