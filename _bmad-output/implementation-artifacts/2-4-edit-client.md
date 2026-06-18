# Story 2.4: Edit Client

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit any field of an existing client,
so that the client information stays up to date.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail in the right panel, **When** the user clicks "Editar", **Then** the client form opens pre-filled with the current values of Nombre, NIT/RUC, Teléfono, and Ciudad (FR6).

2. **Given** the user modifies one or more fields and submits the form, **When** the form is saved successfully (backend returns 200 OK), **Then** the changes are reflected immediately in the client detail panel and in the client list (via `queryClient.invalidateQueries({ queryKey: ['clientes'] })` and `queryClient.invalidateQueries({ queryKey: ['clientes', id] })`) (FR27 / NFR2).
   **And** a toast de éxito muestra "Cliente actualizado correctamente".

3. **Given** the user clears a required field (Nombre, NIT/RUC, Teléfono, or Ciudad) and submits, **When** the form is validated by Zod, **Then** an inline error message appears on the empty field and the form is NOT submitted to the backend (FR8 / R-206).

4. **Given** the user clicks "Cancelar" without saving, **When** the form closes, **Then** the original client data remains unchanged and the detail panel shows the original values.

## Tasks / Subtasks

- [ ] Task 1 — Backend: Implement `PUT /api/v1/clientes/{id}` endpoint (AC: #2, #3)
  - [ ] Create `UpdateClienteCommand.cs` in `backend/src/SiesaAgents.Application/Clientes/Commands/` — properties: `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`
  - [ ] Create `UpdateClienteCommandHandler.cs` in `backend/src/SiesaAgents.Application/Clientes/Commands/` — calls `IClienteRepository.GetByIdAsync(command.Id, ct)`, throws `NotFoundException` when null; calls `entity.Update(nombre, nit, telefono, ciudad)` (domain method); calls `IClienteRepository.UpdateAsync(entity, ct)`; returns `ClienteDto`
  - [ ] Add `Update(string nombre, string nit, string telefono, string ciudad)` method to `ClienteEntity.cs` in `backend/src/SiesaAgents.Domain/Clientes/Entities/` — updates fields and sets `UpdatedAt = DateTimeOffset.UtcNow`
  - [ ] Add `UpdateAsync(ClienteEntity entity, CancellationToken ct)` to `IClienteRepository.cs` in `backend/src/SiesaAgents.Domain/Clientes/Interfaces/`
  - [ ] Implement `UpdateAsync` in `ClienteRepository.cs` in `backend/src/SiesaAgents.Infrastructure/Repositories/` — EF Core `Update(entity)` + `SaveChangesAsync(ct)`
  - [ ] Create `UpdateClienteRequest.cs` in `backend/src/SiesaAgents.Application/Clientes/DTOs/` — properties: `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`
  - [ ] Create `UpdateClienteRequestValidator.cs` in `backend/src/SiesaAgents.Application/Clientes/Validators/` — FluentValidation: `RuleFor(x => x.Nombre).NotEmpty()`, `RuleFor(x => x.Nit).NotEmpty()`, `RuleFor(x => x.Telefono).NotEmpty()`, `RuleFor(x => x.Ciudad).NotEmpty()`
  - [ ] Map `PUT /api/v1/clientes/{id}` in `ClienteEndpoints.cs` (`backend/src/SiesaAgents.API/Endpoints/`) — receives `UpdateClienteRequest` body + `{id}` path param; calls `UpdateClienteCommandHandler`; returns `200 OK` with `ClienteDto` on success; `404 Problem Details` when not found; `400 Problem Details` on FluentValidation failure
  - [ ] Register `UpdateClienteCommandHandler` in `Program.cs` DI

- [ ] Task 2 — Frontend Application layer: `useUpdateCliente` mutation hook (AC: #2, #3)
  - [ ] Create `useUpdateCliente.ts` in `frontend/src/modules/crm/clientes/application/` — TanStack Query `useMutation`:
    - `mutationFn: ({ id, data }: { id: string; data: UpdateClientePayload }) => clienteApiRepository.update(id, data)`
    - `onSuccess: (_, { id }) => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); queryClient.invalidateQueries({ queryKey: ['clientes', id] }); toast.success('Cliente actualizado correctamente'); }`
    - `onError: () => toast.error('No se pudo guardar. Intenta de nuevo.')`
    - Export `mutate`, `isPending`, `isError`
  - [ ] Add `update(id: string, data: UpdateClientePayload): Promise<Cliente>` to `IClienteRepository.ts` in `frontend/src/modules/crm/clientes/domain/`
  - [ ] Implement `update` in `clienteApiRepository.ts` in `frontend/src/modules/crm/clientes/infrastructure/` — `apiClient.put<Cliente>(\`/api/v1/clientes/${id}\`, data)`
  - [ ] Create `UpdateClientePayload` type in `frontend/src/modules/crm/clientes/domain/Cliente.ts` — `{ nombre: string; nit: string; telefono: string; ciudad: string }`

- [ ] Task 3 — Frontend Application layer: Zod schema for edit (AC: #3)
  - [ ] Reuse or extend `clienteSchema.ts` in `frontend/src/modules/crm/clientes/application/` — ensure `clienteSchema` (used for both create and edit) validates: `nombre: z.string().min(1, 'El nombre es requerido')`, `nit: z.string().min(1, 'El NIT/RUC es requerido')`, `telefono: z.string().min(1, 'El teléfono es requerido')`, `ciudad: z.string().min(1, 'La ciudad es requerida')`
  - [ ] Export `ClienteFormValues` type inferred from schema: `type ClienteFormValues = z.infer<typeof clienteSchema>`

- [ ] Task 4 — Frontend Presentation: `ClienteForm` component for edit mode (AC: #1, #2, #3, #4)
  - [ ] Create (or extend if it already exists) `ClienteForm.tsx` in `frontend/src/modules/crm/clientes/presentation/` — React Hook Form + Zod resolver component:
    - Accepts props: `cliente: Cliente` (pre-fill values), `onSuccess?: () => void`, `onCancel?: () => void`
    - `useForm<ClienteFormValues>({ resolver: zodResolver(clienteSchema), defaultValues: { nombre: cliente.nombre, nit: cliente.nit, telefono: cliente.telefono, ciudad: cliente.ciudad } })`
    - On submit: calls `mutate({ id: cliente.id, data: formValues })`, then calls `onSuccess?.()` after mutation success
    - "Cancelar" button calls `onCancel?.()` without submitting
    - Shows spinner / disables submit button while `isPending === true`
    - All field labels in Spanish: "Nombre", "NIT/RUC", "Teléfono", "Ciudad"
    - All placeholder text in Spanish: "Nombre del cliente", "NIT o RUC", "Número de teléfono", "Ciudad"
    - All inline error messages in Spanish (from Zod schema)
    - Check siesa-ui-kit catalog before creating any custom input sub-component
  - [ ] Use `data-testid="cliente-form"` on the form root element

- [ ] Task 5 — Frontend Presentation: wire "Editar" button in `ClienteDetailView` (AC: #1, #2, #4)
  - [ ] Modify `ClienteDetailView.tsx` in `frontend/src/modules/crm/clientes/presentation/` to add:
    - Local `isEditing: boolean` state (`useState(false)`)
    - "Editar" button (`<button onClick={() => setIsEditing(true)}>Editar</button>`) visible when `isEditing === false` and `data` is present
    - When `isEditing === true`: render `<ClienteForm cliente={data} onSuccess={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />` in place of the detail display
    - When `isEditing === false`: render the read-only detail fields (Nombre, NIT/RUC, Teléfono, Ciudad)
  - [ ] Apply Siesa brand colors to the "Editar" button: `bg-[#0e79fd] text-white` (primary), with hover state `hover:bg-[#154ca9]` (tertiary)
  - [ ] Use Heroicons for the "Editar" button icon: `PencilSquareIcon` from `@heroicons/react/24/outline`

- [ ] Task 6 — Frontend Unit & Component Tests (AC: #1, #2, #3, #4)
  - [ ] `useUpdateCliente.test.ts` (co-located with `useUpdateCliente.ts`) — unit test:
    - MSW handler `PUT /api/v1/clientes/:id → 200` with updated `ClienteDto`; assert mutation resolves and `invalidateQueries` is called for both `['clientes']` and `['clientes', id]`
    - MSW handler `PUT /api/v1/clientes/:id → 400`; assert `isError === true`
    - MSW handler `PUT /api/v1/clientes/:id → 404`; assert `isError === true`
  - [ ] `ClienteForm.test.tsx` (co-located with `ClienteForm.tsx`) — component tests:
    - Edit mode: form renders pre-filled with `cliente` fixture values (Nombre, NIT/RUC, Teléfono, Ciudad)
    - Submit valid edited form; assert MSW `PUT` called with updated values
    - Clear Nombre field and submit; assert inline error "El nombre es requerido", no PUT request fired
    - Click "Cancelar"; assert `onCancel` callback invoked and no PUT request fired
    - Assert toast "Cliente actualizado correctamente" after successful submit
  - [ ] `ClienteDetailView.test.tsx` — add test cases (co-located):
    - "Editar" button visible when detail is loaded; click → form renders pre-filled (AC: #1)
    - "Cancelar" from form → form hides, original detail shown (AC: #4)

- [ ] Task 7 — Backend xUnit Tests (AC: #2, #3)
  - [ ] `UpdateClienteTests.cs` in `backend/tests/SiesaAgents.UnitTests/Application/Clientes/`:
    - Happy path: `PUT /api/v1/clientes/{existingId}` with valid payload → 200 with updated `ClienteDto` (assert all 4 fields updated)
    - Validation: `PUT` with `Nombre=""` → 400 Problem Details with `errors.Nombre` key
    - Validation: `PUT` with `Nit=""` → 400 Problem Details with `errors.Nit` key
    - Not found: `PUT /api/v1/clientes/{nonexistentUuid}` → 404 Problem Details
    - Response shape: assert returned object contains `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, and `updatedAt` fields (verify `UpdatedAt` changed)

## Dev Notes

### Architecture Patterns

This story implements the **write/update side** of the Client domain following Clean Architecture + DDD. The pattern mirrors Story 2.2 (read) and Story 2.3 (create), with the CQRS `UpdateClienteCommand` / `UpdateClienteCommandHandler` pattern.

**TanStack Query invalidation (CRITICAL — R-202):** After a successful mutation, BOTH query keys must be invalidated:
```typescript
queryClient.invalidateQueries({ queryKey: ['clientes'] })       // list
queryClient.invalidateQueries({ queryKey: ['clientes', id] })   // single
```
Missing either invalidation causes stale data — this is the highest-risk item (score 9) per `test-design-epic-2.md`.

**Backend note from Story 2.1/2.2 dev notes:** The environment runs .NET 8 (not .NET 10). All architecture patterns remain identical; use .NET 8-compatible NuGet package versions.

**`UpdatedAt` field:** `ClienteEntity` already has `UpdatedAt (DateTimeOffset)` from the architecture schema. The `Update()` domain method must set `UpdatedAt = DateTimeOffset.UtcNow` on every call. Verify this field is included in `ClienteDto.cs` and returned from the `PUT` endpoint.

**Form state co-location:** Edit state (`isEditing`) is managed as local `useState` in `ClienteDetailView` — no Zustand store needed (architecture decision: URL is the source of truth, UI-only state stays local).

**`ClienteForm` reuse:** The architecture document specifies `ClienteForm.tsx` is shared between create (Story 2.3) and edit (this story). If Story 2.3 already created it, extend it to accept an optional `cliente` prop for pre-fill. If it does not exist yet, create it with full support for both modes.

**Zod schema reuse:** `clienteSchema.ts` is already specified in the architecture for both create and edit. Reuse it — do not create a separate schema for edit.

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit`
- **Install**: already installed via `pnpm add siesa-ui-kit` in Story 1.1
- **Usage**: Check `siesa-ui-kit` catalog before creating any custom component.
- **Constraint**: Do not create custom components if a `siesa-ui-kit` equivalent exists.
- **MasterCrud**: NOT applicable for this story. `ClienteForm` is an inline edit form within `ClienteDetailView` — not a full CRUD orchestrator screen with a data grid. MasterCrud applies when a screen includes a table grid + create + edit + delete as a unified CRUD interface.
- **Icons**: Heroicons (primary per company standards) — import from `@heroicons/react/24/outline`. Use `PencilSquareIcon` for the "Editar" button.
- **Loading states**: Disable the submit button and show a loading indicator (`isPending`) during mutation — do NOT use full-screen spinners.

### All user-facing text MUST be in Spanish

- Editar button: `"Editar"`
- Cancelar button: `"Cancelar"`
- Save button: `"Guardar"`
- Toast success: `"Cliente actualizado correctamente"`
- Toast error: `"No se pudo guardar. Intenta de nuevo."`
- Field label Nombre: `"Nombre"`
- Field label NIT/RUC: `"NIT/RUC"`
- Field label Teléfono: `"Teléfono"`
- Field label Ciudad: `"Ciudad"`
- Inline error empty Nombre: `"El nombre es requerido"`
- Inline error empty NIT/RUC: `"El NIT/RUC es requerido"`
- Inline error empty Teléfono: `"El teléfono es requerido"`
- Inline error empty Ciudad: `"La ciudad es requerida"`

### API Contract

```
PUT /api/v1/clientes/{id}
  Request body (JSON):
  {
    "nombre": "string",
    "nit": "string",
    "telefono": "string",
    "ciudad": "string"
  }

  Response 200 OK: ClienteDto (updated object)
  {
    "id": "uuid",
    "nombre": "string",
    "nit": "string",
    "telefono": "string",
    "ciudad": "string",
    "createdAt": "2026-03-12T10:30:00Z",
    "updatedAt": "2026-06-18T10:30:00Z"
  }

  Response 400: Problem Details RFC 7807 (FluentValidation)
  {
    "status": 400,
    "title": "Bad Request",
    "errors": { "Nombre": ["'Nombre' must not be empty."] }
  }

  Response 404: Problem Details RFC 7807
  {
    "status": 404,
    "title": "Not Found",
    "detail": "Cliente no encontrado."
  }
```

### Frontend File Structure

New files to create:
```
frontend/src/
  modules/crm/clientes/
    application/
      useUpdateCliente.ts              # TanStack Query useMutation hook
      useUpdateCliente.test.ts         # Unit test (co-located)
```

Files to modify:
```
frontend/src/
  modules/crm/clientes/
    domain/
      Cliente.ts                       # Add UpdateClientePayload type
      IClienteRepository.ts            # Add update(id, data): Promise<Cliente>
    application/
      clienteSchema.ts                 # Verify/reuse schema (create if Story 2.3 didn't)
    infrastructure/
      clienteApiRepository.ts          # Implement update()
    presentation/
      ClienteForm.tsx                  # Create or extend for edit mode with cliente prop
      ClienteForm.test.tsx             # Add/create component tests for edit mode
      ClienteDetailView.tsx            # Add isEditing state + "Editar" button + form toggle
      ClienteDetailView.test.tsx       # Add test cases for edit button and cancel behavior
```

### Backend File Structure

New files to create:
```
backend/src/
  SiesaAgents.Application/Clientes/
    Commands/
      UpdateClienteCommand.cs
      UpdateClienteCommandHandler.cs
    Validators/
      UpdateClienteRequestValidator.cs        (if not created in Story 2.3)
    DTOs/
      UpdateClienteRequest.cs                 (if not created in Story 2.3)
backend/tests/SiesaAgents.UnitTests/
  Application/Clientes/
    UpdateClienteTests.cs
```

Files to modify:
```
backend/src/
  SiesaAgents.Domain/Clientes/
    Entities/ClienteEntity.cs          # Add Update() domain method
    Interfaces/IClienteRepository.cs   # Add UpdateAsync(entity, ct)
  SiesaAgents.Infrastructure/
    Repositories/ClienteRepository.cs  # Implement UpdateAsync
  SiesaAgents.API/
    Endpoints/ClienteEndpoints.cs      # Add PUT /api/v1/clientes/{id} endpoint
    Program.cs                         # Register UpdateClienteCommandHandler
```

### Backend Critical Rules

- `ClienteEntity.Id` → `Guid` (UUID) — query by `id` using `GetByIdAsync(id)` before update; throw `NotFoundException` when null
- `UpdatedAt` must be `DateTimeOffset` — set to `DateTimeOffset.UtcNow` in the `Update()` domain method
- `ClienteDto` must include `UpdatedAt` field so the frontend can confirm the update was applied
- Error format: Problem Details RFC 7807 (enforced by existing `ExceptionHandlingMiddleware`)
- No `stackTrace` key must appear in any error response body (NFR6)
- Register `Scalar` in `Program.cs` — NEVER `app.UseSwagger()`
- `UpdateClienteRequestValidator` follows same FluentValidation pattern as `CreateClienteRequestValidator`

### Risk Coverage (from test-design-epic-2.md)

| Risk | Score | Mitigation in this story |
|------|-------|--------------------------|
| R-202 — Optimistic invalidation missing | 9 | `useUpdateCliente` must call `invalidateQueries` for BOTH `['clientes']` and `['clientes', id]` in `onSuccess`; component test asserts list updates immediately |
| R-206 — Required field bypass | 2 | Zod `clienteSchema` rejects empty fields; AC #3 component test asserts inline error on cleared required field, no PUT fired |
| R-210 — Toast in English | 1 | Component test asserts exact Spanish toast text: `"Cliente actualizado correctamente"` |

### Testing Standards for This Story

Per `test-design-epic-2.md` Story 2.4 matrix:

| Level | Count | Scenarios |
|-------|-------|-----------|
| E2E (Playwright) | 1 | Edit Nombre, save, assert updated name visible in left panel (P1) |
| API Integration (xUnit) | 3 | PUT 200 happy path; PUT 400 FluentValidation; PUT 404 unknown id |
| Component (Vitest + RTL + MSW) | 4 | Form pre-filled; save → list updated (invalidateQueries); clear required field → inline error; cancel → original data unchanged |
| Unit (Vitest) | 2 | Zod schema rejects empty fields; `useUpdateCliente` invalidates correct keys |

Test fixtures needed:
- `clienteFactory()` — reuse existing fixture from Stories 2.1/2.2 (single `ClienteDto` with randomized UUID, nombre, nit, telefono, ciudad)
- `updateClienteRequestFactory()` — valid `UpdateClienteRequest` payload with different values from `clienteFactory()` to verify update was applied
- MSW handler: `PUT /api/v1/clientes/:id → 200` with updated `clienteFactory()` response
- MSW handler: `PUT /api/v1/clientes/:id → 400` with Problem Details body
- MSW handler: `PUT /api/v1/clientes/:id → 404` with Problem Details body

### Project Structure Notes

- `ClienteDetailView.tsx` was created in Story 2.2 — extend it to add `isEditing` state and the "Editar" button/form toggle.
- `ClienteForm.tsx` is specified in the architecture — if Story 2.3 created it, extend it by adding support for the optional `cliente` pre-fill prop. If it does not exist, create it fresh with both create and edit modes supported.
- `clienteSchema.ts` is specified in the architecture — if Story 2.3 created it, reuse it. Do NOT duplicate it.
- `clienteApiRepository.ts`, `IClienteRepository.ts`, `AppDbContext.cs`, `ClienteRepository.cs`, and `ClienteEndpoints.cs` exist from previous stories — add the `update` method without removing existing methods.
- `NotFoundException.cs` at `SiesaAgents.Domain/Exceptions/NotFoundException.cs` was created in Story 2.2 — reuse it; do NOT recreate.
- `ExceptionHandlingMiddleware.cs` already maps `NotFoundException` to 404 — no changes needed for the not-found case.
- `queryClient.ts` already has `retry: 0` set — validation errors (400) will surface immediately without retry backoff.

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md` — Story 2.4]
- Architecture decisions (routing, query keys, API contract, file structure, mutation pattern): [Source: `_bmad-output/planning-artifacts/architecture.md` — Process Patterns (TanStack Query mutations), API & Communication Patterns, Complete Project Directory Structure, Component Boundaries]
- Company standards (stack, folder structure, naming, rules): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]
- Test design matrix and risks: [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — Story 2.4, Risk Matrix R-202]
- Previous story learnings: [Source: `_bmad-output/implementation-artifacts/2-2-client-detail-view.md` — Dev Notes (NotFoundException, query key pattern, split-panel wiring)]
- MasterCrud reference: [Source: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`] — NOT applicable to this story (inline edit form within detail panel, not a full CRUD grid screen)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
