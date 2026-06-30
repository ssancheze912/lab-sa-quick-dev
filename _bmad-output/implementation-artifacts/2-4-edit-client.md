# Story 2.4: Edit Client

Status: ready-for-dev

## Story

As a commercial team member,
I want to edit any field of an existing client,
so that the client information stays up to date.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** the user clicks "Editar", **Then** the client form opens pre-filled with the current values of all fields (FR6).

2. **Given** the user modifies one or more fields and submits, **When** the form is saved, **Then** the changes are reflected in the client detail and list immediately (FR27), **And** a success toast shows "Cliente actualizado correctamente".

3. **Given** the user clears a required field and submits, **When** the form is validated, **Then** an inline error message appears on that field and the form is NOT submitted (FR8).

4. **Given** the user clicks "Cancelar" without saving, **When** the form closes, **Then** the original client data remains unchanged.

## Tasks / Subtasks

- [ ] Task 1 — Add `useUpdateCliente` mutation hook in application layer (AC: #2, #3)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
  - [ ] Use `useMutation` with `mutationFn: (data: UpdateClienteRequest) => clienteApiRepository.update(data.id, data)`
  - [ ] `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` + `queryClient.invalidateQueries({ queryKey: ['clientes', id] })` + `toast.success('Cliente actualizado correctamente')`
  - [ ] `onError`: `toast.error('No se pudo guardar. Intenta de nuevo.')`
  - [ ] Return `{ mutate, isPending, isError }` from the hook

- [ ] Task 2 — Define `UpdateClienteRequest` type in domain layer (AC: #1)
  - [ ] Add `UpdateClienteRequest` interface to `frontend/src/modules/crm/clientes/domain/Cliente.ts`:
    ```ts
    export interface UpdateClienteRequest {
      id: string;
      nombre: string;
      nit: string;
      telefono: string;
      ciudad: string;
    }
    ```

- [ ] Task 3 — Add `update(id, data)` method to `IClienteRepository` and `clienteApiRepository` (AC: #2)
  - [ ] Extend `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` with `update(id: string, data: UpdateClienteRequest): Promise<Cliente>`
  - [ ] Implement in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: PUT to `/api/v1/clientes/${id}` via shared `apiClient`

- [ ] Task 4 — Add edit mode to `clienteSchema.ts` Zod validation (AC: #1, #3)
  - [ ] Open `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
  - [ ] Export `updateClienteSchema` (same shape as `createClienteSchema` but can include `id`):
    ```ts
    export const updateClienteSchema = z.object({
      nombre: z.string().min(1, 'Nombre requerido'),
      nit: z.string().min(1, 'NIT/RUC requerido'),
      telefono: z.string().min(1, 'Teléfono requerido'),
      ciudad: z.string().min(1, 'Ciudad requerida'),
    });
    export type UpdateClienteFormData = z.infer<typeof updateClienteSchema>;
    ```

- [ ] Task 5 — Extend `ClienteForm` to support edit mode (AC: #1, #2, #3, #4)
  - [ ] Modify `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
  - [ ] Add optional props: `mode?: 'create' | 'edit'` and `initialValues?: UpdateClienteFormData & { id: string }`
  - [ ] When `mode === 'edit'`: use `zodResolver(updateClienteSchema)` + `defaultValues` pre-filled from `initialValues`
  - [ ] On valid submit in edit mode: call `mutate(formData)` from `useUpdateCliente`
  - [ ] Close form only in `onSuccess` callback (not immediately)
  - [ ] "Guardar" button disabled and shows loading state while `isPending === true`
  - [ ] "Cancelar" button calls `onClose()` without submitting — original data stays unchanged (AC: #4)
  - [ ] All field labels, placeholders, and error messages remain in Spanish
  - [ ] Maintain existing `data-testid="cliente-form"` and `data-testid="cliente-form-submit"` attributes
  - [ ] Maintain WCAG 2.1 AA: explicit `<label>` with `htmlFor` for each input; `aria-required="true"` on all inputs

- [ ] Task 6 — Add "Editar" button to `ClienteDetailView` (AC: #1, #2, #4)
  - [ ] Modify `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - [ ] Add local `isEditFormOpen: boolean` state
  - [ ] Add "Editar" button (`PencilSquareIcon` from `@heroicons/react/24/outline`) in the detail panel header
  - [ ] Button click → sets `isEditFormOpen` to `true`
  - [ ] When `isEditFormOpen === true`: render `ClienteForm` with `mode="edit"` and `initialValues` set to the current client's data
  - [ ] Use the same accessible overlay pattern established in Story 2.3 (custom `div[role="dialog"]` with `aria-modal="true"`, escape key handler)
  - [ ] Pass `onClose={() => setIsEditFormOpen(false)}` and `onSuccess={() => setIsEditFormOpen(false)}` to `ClienteForm`
  - [ ] Button style: secondary action (`text-slate-600 hover:bg-slate-100 border border-slate-300`) with `PencilSquareIcon`
  - [ ] Add `data-testid="edit-cliente-button"` to the "Editar" button
  - [ ] Add `data-testid="edit-cliente-form-overlay"` to the overlay div when open

- [ ] Task 7 — Backend: `UpdateClienteCommand`, handler and validator (AC: #2, #3)
  - [ ] Check if `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs` and its handler already exist (may have been scaffolded in earlier stories)
  - [ ] If NOT found, create:
    - `UpdateClienteCommand.cs`: `record UpdateClienteCommand(Guid Id, string Nombre, string Nit, string Telefono, string Ciudad);`
    - `UpdateClienteCommandHandler.cs`: fetch entity by Id → throw `NotFoundException` if not found → update fields → `await _repository.UpdateAsync(entity, ct)` → return `ClienteDto`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteCommandValidator.cs`:
    ```csharp
    RuleFor(x => x.Nombre).NotEmpty().WithMessage("El nombre es requerido");
    RuleFor(x => x.Nit).NotEmpty().WithMessage("El NIT/RUC es requerido");
    RuleFor(x => x.Telefono).NotEmpty().WithMessage("El teléfono es requerido");
    RuleFor(x => x.Ciudad).NotEmpty().WithMessage("La ciudad es requerida");
    ```
  - [ ] Register validator in `Program.cs`: `builder.Services.AddScoped<IValidator<UpdateClienteCommand>, UpdateClienteCommandValidator>()`
  - [ ] In handler `Handle()`: call `await _validator.ValidateAndThrowAsync(command, ct)` before persisting
  - [ ] `ExceptionHandlingMiddleware` already maps `ValidationException` → 400 (done in Story 2.3)

- [ ] Task 8 — Backend: wire `PUT /api/v1/clientes/{id}` endpoint (AC: #2)
  - [ ] Open `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [ ] Verify `PUT /api/v1/clientes/{id}` exists and calls `UpdateClienteCommandHandler`
  - [ ] If it does not exist, add:
    ```csharp
    group.MapPut("/{id:guid}", async (Guid id, UpdateClienteRequest request, ...) => { ... })
         .WithName("UpdateCliente")
         .Produces<ClienteDto>()
         .ProducesProblem(400)
         .ProducesProblem(404)
         .ProducesProblem(500);
    ```
  - [ ] Response 200 OK + updated `ClienteDto` (direct object, no wrapper)
  - [ ] Response 400 Problem Details if validation fails
  - [ ] Response 404 Problem Details if `id` not found

- [ ] Task 9 — Backend: `IClienteRepository.UpdateAsync` and implementation (AC: #2)
  - [ ] Add `UpdateAsync(ClienteEntity entity, CancellationToken ct): Task` to `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` (if not present)
  - [ ] Implement in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`:
    ```csharp
    public async Task UpdateAsync(ClienteEntity entity, CancellationToken ct = default)
    {
        _context.Clientes.Update(entity);
        await _context.SaveChangesAsync(ct);
    }
    ```

- [ ] Task 10 — Tests: Frontend unit tests for `useUpdateCliente` and `ClienteForm` edit mode (AC: #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts`:
    - Test: successful mutation invalidates `['clientes']` and `['clientes', id]` query keys
    - Test: successful mutation shows `toast.success('Cliente actualizado correctamente')`
    - Test: failed mutation shows `toast.error('No se pudo guardar. Intenta de nuevo.')`
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx`:
    - Test: form renders pre-filled with `initialValues` when `mode="edit"`
    - Test: all 4 fields are populated from `initialValues`
    - Test: clearing a required field shows inline error and blocks submit (AC: #3)
    - Test: "Cancelar" calls `onClose` without calling mutate (AC: #4)
    - Test: successful submit calls `useUpdateCliente.mutate` with correct payload (AC: #2)
  - [ ] Run: `pnpm exec vitest run src/modules/crm/clientes/` — all tests must pass

- [ ] Task 11 — Tests: Backend unit tests for `UpdateClienteCommandHandler` and validator (AC: #2, #3)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`:
    - Test: valid input → updates entity, returns `ClienteDto` with updated fields
    - Test: empty `Nombre` → `ValidationException` thrown
    - Test: empty `Nit` → `ValidationException` thrown
    - Test: non-existent `Id` → `NotFoundException` thrown → mapped to 404
    - Add `UpdateAsync` to the fake `IClienteRepository` used in other test files if not present
  - [ ] Run: `dotnet test tests/SiesaAgents.UnitTests --filter FullyQualifiedName~Clientes` — all tests must pass

## Dev Notes

### Architecture Context

**Clean Architecture layer responsibilities (this story):**
- `domain/`: Add `UpdateClienteRequest` interface to `Cliente.ts`. Extend `IClienteRepository` with `update()` (frontend) and `UpdateAsync()` (backend).
- `application/`: New `useUpdateCliente.ts` mutation hook. Extend `clienteSchema.ts` with `updateClienteSchema`.
- `infrastructure/`: Extend `clienteApiRepository.ts` with `update(id, data)` method calling `PUT /api/v1/clientes/${id}`.
- `presentation/`: Modify `ClienteForm.tsx` for edit mode. Modify `ClienteDetailView.tsx` to add "Editar" button and form toggling.
- Backend `Application/Clientes/Validators/`: New `UpdateClienteCommandValidator.cs`.

**Files to check before creating (may exist from earlier story scaffolding):**
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — check if `PUT /api/v1/clientes/{id}` already exists

### Backend: `PUT /api/v1/clientes/{id}` Contract

Per architecture.md:
```
PUT /api/v1/clientes/{id}
  Request body: { "nombre": "string", "nit": "string", "telefono": "string", "ciudad": "string" }
  Response 200: ClienteDto (direct object, no wrapper)
  Response 400: Problem Details RFC 7807 (validation errors)
  Response 404: Problem Details RFC 7807 (client not found)
  Response 500: Problem Details RFC 7807
```

**ClienteDto shape** (existing):
```json
{ "id": "uuid", "nombre": "...", "nit": "...", "telefono": "...", "ciudad": "...", "createdAt": "2026-03-12T10:30:00Z", "updatedAt": "..." }
```

`updatedAt` field must be set to `DateTimeOffset.UtcNow` when the entity is updated in the handler.

### Form Pre-fill Pattern

When `ClienteDetailView` opens the edit form, it must pass the currently loaded client data as `initialValues`. The `useCliente(id)` hook (TanStack Query) already holds the current values — use its `data` result:

```tsx
// ClienteDetailView.tsx
const { data: cliente } = useCliente(clienteId);
// ...
{isEditFormOpen && cliente && (
  <ClienteForm
    mode="edit"
    initialValues={{ id: cliente.id, nombre: cliente.nombre, nit: cliente.nit, telefono: cliente.telefono, ciudad: cliente.ciudad }}
    onClose={() => setIsEditFormOpen(false)}
    onSuccess={() => setIsEditFormOpen(false)}
  />
)}
```

### State Management Decisions

- `useUpdateCliente` — TanStack Query `useMutation`; on success invalidates both `['clientes']` (list) and `['clientes', id]` (detail) query keys to update both panels immediately (FR27 compliance).
- Form open/close state: local `useState<boolean>` in `ClienteDetailView` — NOT Zustand (no cross-route persistence needed, consistent with Story 2.3 pattern).
- After update: `invalidateQueries` triggers automatic re-fetch; updated data appears in both the left list panel and right detail panel without manual state manipulation.

### TanStack Query Invalidation — Mandatory Pattern

```typescript
useMutation({
  mutationFn: (data: UpdateClienteRequest) => clienteApiRepository.update(data.id, data),
  onSuccess: (_, variables) => {
    queryClient.invalidateQueries({ queryKey: ['clientes'] });
    queryClient.invalidateQueries({ queryKey: ['clientes', variables.id] });
    toast.success('Cliente actualizado correctamente');
  },
  onError: () => toast.error('No se pudo guardar. Intenta de nuevo.'),
})
```

### UI Implementation Requirements

**Edit button placement:**
- Location: top-right area of `ClienteDetailView` panel, beside the existing client Nombre heading
- Icon: `PencilSquareIcon` from `@heroicons/react/24/outline` (already installed)
- Style: secondary action (`text-slate-600 hover:bg-slate-100 border border-slate-300 rounded px-3 py-1.5 text-sm flex items-center gap-1`)
- Spanish label: "Editar"

**Form modal pattern (consistent with Story 2.3):**
- Use the same accessible overlay (`div[role="dialog"]` with `aria-modal="true"`, `aria-labelledby` pointing to form title, backdrop click closes form)
- Escape key handler to close (`onKeyDown={(e) => e.key === 'Escape' && onClose()}` on the overlay wrapper)
- Focus management: first input (`nombre`) should receive focus on open (`autoFocus` or `useEffect` + `ref.focus()`)

**MasterCrud consideration:**
- This story modifies the existing `ClienteDetailView` (split-panel layout) and `ClienteForm`. MasterCrud is NOT applicable — the existing architecture uses a custom split-panel, not a MasterCrud grid. Do NOT replace with MasterCrud.

### Open Review Items from Story 2.3 (Applicable to This Story)

Story 2.3 left two open items that apply here:
- `[AI-Review][MED]` Custom dialog modal has no focus trap (WCAG 2.1.2). When implementing the edit form overlay, either:
  - Add `@radix-ui/react-focus-scope` for a proper focus trap, OR
  - Replace the overlay with `siesa-ui-kit AlertDialog` (preferred going forward)
  - This story is the right time to resolve this open item — choose one approach and apply it consistently to both the edit form AND the existing create form.
- `[AI-Review][LOW]` Submit button icon: consider `CheckIcon` or `ArrowDownTrayIcon` instead of `PlusIcon` for the save action. Applies to `ClienteForm` in both create and edit modes.

### Testing Standards Summary

**Frontend (Vitest + RTL + MSW):**
- Co-locate tests alongside source files
- `vi.mock('../application/useUpdateCliente')` in `ClienteForm.edit.test.tsx`
- MSW handlers for `PUT /api/v1/clientes/:id`: 200 (success), 400 (validation), 404 (not found)
- Use `userEvent.type(...)` for input interaction; `userEvent.clear(...)` + `userEvent.type(...)` for modifying pre-filled fields
- Verify React Hook Form `defaultValues` are rendered in inputs by checking `input.value`
- Coverage target: >80% for new files
- Run: `pnpm --filter frontend test` or `pnpm exec vitest run src/modules/crm/clientes/`

**Backend (xUnit):**
- Manual fake repository — no Moq/NSubstitute (consistent with Stories 2.1–2.3)
- Add `UpdateAsync` stub to the existing `FakeClienteRepository` used across test files
- Solution file: `SiesaAgents.slnx` — run: `dotnet test tests/SiesaAgents.UnitTests`
- `using Xunit;` must be explicit in every test file

### Previous Story Learnings (Stories 2.1 – 2.3)

- Solution file: `SiesaAgents.slnx` (XML format, .NET 10) — NOT `SiesaAgents.sln`
- `using Xunit;` must be explicit in every test file
- No Moq/NSubstitute — use manual fake implementations for repositories
- `@heroicons/react` is installed (`/24/outline` and `/24/solid` variants available)
- `sonner` is used for toast notifications (`import { toast } from 'sonner'`) — `<Toaster>` already in `main.tsx`
- `shadcn/ui Dialog` is installed but not used for forms — project uses custom accessible overlay (established in Story 2.3)
- `clienteDetailStore` (Zustand) was introduced in Story 2.2 — keep form-open state as local `useState`, do NOT add to store
- `aria-required="true"` must be on all required inputs (WCAG 2.1 AA — added in Story 2.3)
- Route tree (`routeTree.gen.ts`) is auto-regenerated — no new routes needed for this story
- `@testing-library/user-event` is a dev dependency (added in Story 2.3)
- `react-loading-skeleton` is installed and used in `ClienteListView`
- Git commit prefix convention: `feat(story-2.4):` for this story

### Project Structure Notes

**New files to create:**
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx`
- `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteCommandValidator.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`

**Files to modify:**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts` — add `UpdateClienteRequest` interface
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `update(id, data)` method
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `update(id, data)` calling `PUT /api/v1/clientes/${id}`
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts` — add `updateClienteSchema` and `UpdateClienteFormData`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` — add edit mode support (`mode`, `initialValues` props)
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — add "Editar" button + edit form toggle logic
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — add `UpdateAsync` if not present
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implement `UpdateAsync` if not present
- `backend/src/SiesaAgents.API/Program.cs` — register `IValidator<UpdateClienteCommand>` → `UpdateClienteCommandValidator`
- All existing fake `IClienteRepository` implementations in test files — add `UpdateAsync` stub

**Files to check before creating (may already exist):**
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — check `PUT /api/v1/clientes/{id}`

### References

- FR5 (editar cliente), FR6 (pre-fill form), FR8 (validación campos requeridos), FR27 (cambios inmediatos): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- NFR2 (CRUD < 2s) — TanStack Query invalidation: [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- NFR6 (no stack traces) — Problem Details: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- PUT /api/v1/clientes/{id} contract: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Mutation + invalidation pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- Story 2.3 completion notes (sonner, custom overlay, aria-required): [Source: _bmad-output/implementation-artifacts/2-3-create-client.md#Completion Notes List]
- Story 2.3 open review items (focus trap, button icon): [Source: _bmad-output/implementation-artifacts/2-3-create-client.md#Review Follow-ups (AI)]
- MasterCrud reference — not applicable to split-panel form: [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- Company standards (Clean Architecture, siesa-ui-kit priority, Spanish UI text): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
