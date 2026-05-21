# Story 2.4: Edit Client

Status: ready

## Story

As a commercial team member,
I want to edit any field of an existing client,
so that the client information stays up to date.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** the user clicks "Editar", **Then** the client form opens pre-filled with the current values of all fields: Nombre, NIT/RUC, Teléfono, Ciudad (FR6).

2. **Given** the user modifies one or more fields and clicks "Guardar", **When** the form is submitted, **Then** the changes are persisted via `PUT /api/v1/clientes/:id`, the dialog closes, the updated values are reflected in the client detail panel and list immediately without a page reload (FR27), and a toast displays "Cliente actualizado correctamente".

3. **Given** the user clears a required field and clicks "Guardar", **When** the Zod schema validation runs on submit, **Then** an inline error message appears under the empty field (FR8), the form does NOT send any request to the backend, and the dialog remains open.

4. **Given** the user clicks "Cancelar" without saving, **When** the dialog closes, **Then** the original client data remains unchanged and no PUT request is fired.

## Tasks / Subtasks

- [ ] Task 1 — Frontend: create `useUpdateCliente` mutation hook (AC: 2, 3)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
  - [ ] Use `useMutation` with `mutationFn: ({ id, data }: { id: string; data: ClienteFormValues }) => clienteApiRepository.update(id, data)`
  - [ ] `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })`, then `toast.success('Cliente actualizado correctamente')`
  - [ ] `onError`: call `toast.error('No se pudo guardar. Intenta de nuevo.')`
  - [ ] Return mutation object including `isPending` and `error`
  - [ ] Add `update(id: string, data: UpdateClientePayload): Promise<Cliente>` to `IClienteRepository` interface
  - [ ] Implement `update()` in `clienteApiRepository.ts` — `PUT /api/v1/clientes/:id`, return typed `Cliente`

- [ ] Task 2 — Frontend: update `ClienteFormDialog` to support edit mode (AC: 1, 2, 3, 4)
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteFormDialog.tsx`
  - [ ] Add optional props: `cliente?: Cliente` (when defined, dialog is in edit mode)
  - [ ] When `cliente` prop is provided, call `reset(cliente)` via `useEffect` so all fields are pre-filled
  - [ ] When in edit mode, call `useUpdateCliente` hook; when in create mode, use `useCreateCliente` hook
  - [ ] On successful update: invalidate query, close dialog via `onClose()`, show toast
  - [ ] On cancel: call `onClose()` without firing PUT — no pending mutation
  - [ ] "Guardar" button shows loading state while `isPending` is true (`disabled` + "Guardando..." text)
  - [ ] Dialog title changes to "Editar cliente" in edit mode vs "Nuevo cliente" in create mode
  - [ ] `data-testid="cliente-form-dialog"` remains on `DialogContent` (already exists)
  - [ ] `data-testid="input-nombre|input-nit|input-telefono|input-ciudad"` remain on each input (already exist)
  - [ ] `data-testid="btn-guardar"` and `data-testid="btn-cancelar"` remain (already exist)

- [ ] Task 3 — Frontend: add "Editar" button to `ClienteDetailPanel` (AC: 1)
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`
  - [ ] Add an "Editar" button to the detail panel
  - [ ] Button click opens `ClienteFormDialog` in edit mode, passing the current `cliente` as prop
  - [ ] Control dialog open state with `useState<boolean>`
  - [ ] `data-testid="btn-editar"` on the button
  - [ ] Siesa Blue `#0e79fd` as primary color

- [ ] Task 4 — Backend: verify PUT endpoint with UpdateClienteCommandHandler (AC: 2, 3)
  - [ ] Verify `PUT /api/v1/clientes/{id}` is registered in `ClienteEndpoints.cs` — returns 200 + updated `ClienteDto` or 404 Problem Details
  - [ ] Verify `UpdateClienteCommandHandler` uses `UpdateClienteRequestValidator` (FluentValidation — all 4 fields required)
  - [ ] Verify `UpdateClienteRequestValidator` maps `ValidationException` → 400 Problem Details via `ExceptionHandlingMiddleware`
  - [ ] Verify not-found case: handler throws `NotFoundException` (or `KeyNotFoundException`) → 404 Problem Details via middleware
  - [ ] Verify response body includes `id`, `nombre`, `nit`, `telefono`, `ciudad`, `updatedAt` (DateTimeOffset — ISO 8601 with timezone)

- [ ] Task 5 — Write E2E tests (AC: 1, 2, 3, 4)
  - [ ] Create `e2e/tests/clientes/clientes-edit.spec.ts`
    - E2E-C-18 (P0): Clicking "Editar" opens form pre-filled with current field values
    - E2E-C-19 (P0): Modifying a field and saving updates detail panel and list immediately (no reload)
    - E2E-C-20 (P0): Clearing a required field and saving shows inline error; no PUT API call fired
    - E2E-C-21 (P1): Success toast "Cliente actualizado correctamente" appears after successful edit
    - E2E-C-22 (P1): Clicking "Cancelar" closes form without making PUT request; original data unchanged

- [ ] Task 6 — Write API integration tests (AC: 2, 3)
  - [ ] Add to `e2e/tests/clientes/clientes-api.spec.ts`
    - API-C-04 (P0): PUT `/api/v1/clientes/:id` with valid changes returns 200 and updated fields in body
    - API-C-10 (P1): PUT `/api/v1/clientes/:id` with missing required field returns 400 Problem Details

- [ ] Task 7 — Write backend unit tests (AC: 2, 3)
  - [ ] Add to `backend/tests/SiesaAgents.UnitTests/Handlers/ClienteHandlerTests.cs`
    - UNIT-B-07 (P1): `UpdateClienteHandler` returns updated `ClienteDto` when client exists
    - UNIT-B-08 (P1): `UpdateClienteHandler` throws `NotFoundException` (or equivalent) when client ID does not exist
  - [ ] Add to `backend/tests/SiesaAgents.UnitTests/Validators/ClienteValidatorTests.cs`
    - UNIT-B-09 (P1): `UpdateClienteCommandValidator`: empty Nombre fails with error message
    - UNIT-B-10 (P1): `UpdateClienteCommandValidator`: valid payload passes validation

## Dev Notes

### Context from Previous Stories

- `ClienteFormDialog.tsx` was created in Story 2.3 with create-only logic. This story extends it to support edit mode via an optional `cliente` prop.
- `clienteSchema.ts` Zod schema already exists at `frontend/src/modules/crm/clientes/application/clienteSchema.ts` — reuse as-is (same 4 required fields).
- `IClienteRepository` interface and `clienteApiRepository.ts` already have `create()` method. Add `update()` following the same pattern.
- `UpdateClienteCommand`, `UpdateClienteCommandHandler`, `UpdateClienteRequestValidator`, and `UpdateClienteRequest` DTO stubs were generated during architecture setup — verify they are fully wired in `Program.cs` DI.
- `ClienteDetailPanel.tsx` was created in Story 2.2 and shows the detail read-only. Add "Editar" button to it.
- `ExceptionHandlingMiddleware` already handles `ConflictException` → 409 (Story 2.3). Verify it also handles not-found → 404 for Story 2.4.
- Toast infrastructure uses custom Zustand `toastStore.ts` + `ToastContainer` component (created in Story 2.3).

### Frontend File Locations

```
frontend/src/
  modules/crm/clientes/
    application/
      useUpdateCliente.ts             # NEW — TanStack Query useMutation hook
    infrastructure/
      clienteApiRepository.ts         # MODIFIED — add update()
    domain/
      IClienteRepository.ts           # MODIFIED — add update()
    presentation/
      ClienteFormDialog.tsx           # MODIFIED — add edit mode via cliente prop
      ClienteDetailPanel.tsx          # MODIFIED — add "Editar" button

e2e/tests/clientes/
  clientes-edit.spec.ts               # NEW — E2E-C-18 to E2E-C-22
  clientes-api.spec.ts                # MODIFIED — add API-C-04 and API-C-10 describe block
```

### Backend File Locations

```
backend/src/
  SiesaAgents.Application/Clientes/Commands/
    UpdateClienteCommand.cs               # Pre-existing — verify wired
    UpdateClienteCommandHandler.cs        # Pre-existing — verify wired
  SiesaAgents.Application/Clientes/DTOs/
    UpdateClienteRequest.cs               # Pre-existing — verify fields
  SiesaAgents.Application/Clientes/Validators/
    UpdateClienteRequestValidator.cs      # Pre-existing — verify all 4 fields required
  SiesaAgents.API/Endpoints/
    ClienteEndpoints.cs                   # MODIFIED — verify PUT /{id:guid} endpoint
  SiesaAgents.API/Program.cs              # MODIFIED — verify UpdateClienteCommandHandler DI registration

backend/tests/
  SiesaAgents.UnitTests/Handlers/
    ClienteHandlerTests.cs                # MODIFIED — add UNIT-B-07, UNIT-B-08
  SiesaAgents.UnitTests/Validators/
    ClienteValidatorTests.cs              # MODIFIED — add UNIT-B-09, UNIT-B-10
```

### Key Implementation Details

**Frontend — edit mode detection:**
```typescript
// ClienteFormDialog.tsx
interface ClienteFormDialogProps {
  open: boolean;
  onClose: () => void;
  cliente?: Cliente; // when defined → edit mode
}

// Pre-fill form when editing
useEffect(() => {
  if (cliente) {
    reset({ nombre: cliente.nombre, nit: cliente.nit, telefono: cliente.telefono, ciudad: cliente.ciudad });
  } else {
    reset({ nombre: '', nit: '', telefono: '', ciudad: '' });
  }
}, [cliente, reset]);
```

**Frontend — mutation selection:**
```typescript
const createMutation = useCreateCliente();
const updateMutation = useUpdateCliente();
const mutation = cliente ? updateMutation : createMutation;

const onSubmit = (data: ClienteFormValues) => {
  if (cliente) {
    updateMutation.mutate({ id: cliente.id, data });
  } else {
    createMutation.mutate(data);
  }
};
```

**Frontend — query invalidation after update (mandatory pattern):**
```typescript
// useUpdateCliente.ts
useMutation({
  mutationFn: ({ id, data }: { id: string; data: ClienteFormValues }) =>
    clienteApiRepository.update(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['clientes'] });
    toast.success('Cliente actualizado correctamente');
  },
  onError: () => toast.error('No se pudo guardar. Intenta de nuevo.')
})
```

**Backend — PUT endpoint contract:**
```
PUT /api/v1/clientes/{id}
Request body: { nombre, nit, telefono, ciudad }
Response 200: { id, nombre, nit, telefono, ciudad, createdAt, updatedAt } (all DateTimeOffset → ISO 8601)
Response 400: Problem Details RFC 7807 (missing required field)
Response 404: Problem Details RFC 7807 (client not found)
```

**E2E test — cancel without PUT:**
```typescript
// E2E-C-22 pattern
let putFired = false;
await page.route('**/api/v1/clientes/**', route => {
  if (route.request().method() === 'PUT') { putFired = true; }
  route.continue();
});
// Open edit, modify field, click cancelar
await clientesPage.abrirEdicion();
await page.getByTestId('input-nombre').fill('Nombre Modificado');
await page.getByTestId('btn-cancelar').click();
expect(putFired).toBe(false);
// Assert original nombre still in detail panel
```

### data-testid Attributes Required

| Attribute | Component | File |
|---|---|---|
| `btn-editar` | `ClienteDetailPanel` | `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx` |
| `cliente-form-dialog` | `ClienteFormDialog` (DialogContent) | `frontend/src/modules/crm/clientes/presentation/ClienteFormDialog.tsx` |
| `input-nombre` | `ClienteFormDialog` | same file (already exists from Story 2.3) |
| `input-nit` | `ClienteFormDialog` | same file (already exists from Story 2.3) |
| `input-telefono` | `ClienteFormDialog` | same file (already exists from Story 2.3) |
| `input-ciudad` | `ClienteFormDialog` | same file (already exists from Story 2.3) |
| `btn-guardar` | `ClienteFormDialog` | same file (already exists from Story 2.3) |
| `btn-cancelar` | `ClienteFormDialog` | same file (already exists from Story 2.3) |

### Test IDs Covered by This Story

| Test ID | Priority | Description |
|---|---|---|
| E2E-C-18 | P0 | Pre-filled form with current values |
| E2E-C-19 | P0 | Edit save updates list immediately (FR27) |
| E2E-C-20 | P0 | Clear required field → error, no PUT fired (FR8) |
| E2E-C-21 | P1 | Toast "Cliente actualizado correctamente" |
| E2E-C-22 | P1 | Cancel: no PUT fired, original data preserved |
| API-C-04 | P0 | PUT returns 200 + updated body |
| API-C-10 | P1 | PUT missing required field → 400 Problem Details |
| UNIT-B-07 | P1 | UpdateClienteHandler returns updated ClienteDto |
| UNIT-B-08 | P1 | UpdateClienteHandler throws on not found |
| UNIT-B-09 | P1 | UpdateClienteValidator: empty Nombre fails |
| UNIT-B-10 | P1 | UpdateClienteValidator: valid payload passes |

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

**Created:**
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
- `e2e/tests/clientes/clientes-edit.spec.ts`

**Modified:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteFormDialog.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.API/Program.cs`
- `backend/tests/SiesaAgents.UnitTests/Handlers/ClienteHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Validators/ClienteValidatorTests.cs`
- `e2e/tests/clientes/clientes-api.spec.ts`
