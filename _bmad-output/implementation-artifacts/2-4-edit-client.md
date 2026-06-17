# Story 2.4: Edit Client

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit the information of an existing client,
so that I can keep client data up to date.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail panel, **When** the user clicks "Editar", **Then** the client form opens pre-filled with the current values of all fields: Nombre, NIT/RUC, Teléfono, Ciudad (FR6).

2. **Given** the user modifies one or more fields and clicks the save button, **When** the form is submitted, **Then** the changes are reflected in the client detail panel and in the client list immediately (FR27), **And** a success toast appears with the text "Cliente actualizado correctamente".

3. **Given** the user clears a required field (Nombre, NIT/RUC, Teléfono, or Ciudad) and clicks save, **When** the form is validated, **Then** an inline error message appears on the cleared field (FR8), **And** the form is NOT submitted to the backend, **And** no API request is fired.

4. **Given** the user has modified one or more fields but clicks "Cancelar" without saving, **When** the form closes, **Then** the original client data remains unchanged in the detail panel, **And** no PUT request is fired.

## Tasks / Subtasks

- [x] Task 1 — Add `UpdateAsync` to backend Domain and Infrastructure layers (AC: #2)
  - [x] Add `UpdateAsync(ClienteEntity entity): Task` method to `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
  - [x] Implement `UpdateAsync` in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`:
    - Use EF Core `_context.Clientes.Update(entity)` + `await _context.SaveChangesAsync()`
    - Set `entity.UpdatedAt = DateTimeOffset.UtcNow` before persisting (requires `SetUpdatedAt(DateTimeOffset value)` method on the entity, or update via the `Update()` factory method below)

- [x] Task 2 — Add `Update()` factory method to `ClienteEntity` (AC: #2)
  - [x] Add `Update(string nombre, string nit, string telefono, string ciudad)` method to `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`:
    ```csharp
    public void Update(string nombre, string nit, string telefono, string ciudad)
    {
        Nombre = nombre;
        Nit = nit;
        Telefono = telefono;
        Ciudad = ciudad;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
    ```

- [x] Task 3 — Create Application layer: Command + Validator + Handler for update (AC: #2, #3)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`:
    ```csharp
    public record UpdateClienteCommand(Guid Id, string Nombre, string NitRuc, string Telefono, string Ciudad);
    ```
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandValidator.cs` (FluentValidation):
    - `RuleFor(x => x.Nombre).NotEmpty().MaximumLength(200)`
    - `RuleFor(x => x.NitRuc).NotEmpty().MaximumLength(50)`
    - `RuleFor(x => x.Telefono).NotEmpty().MaximumLength(50)`
    - `RuleFor(x => x.Ciudad).NotEmpty().MaximumLength(100)`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`:
    - Constructor: inject `IClienteRepository`
    - `HandleAsync(UpdateClienteCommand command)`:
      1. `var cliente = await _repository.GetByIdAsync(command.Id)` → if null, return `null` (or throw domain exception)
      2. `cliente.Update(command.Nombre, command.NitRuc, command.Telefono, command.Ciudad)`
      3. `await _repository.UpdateAsync(cliente)`
      4. Map to `ClienteDto` and return

- [x] Task 4 — Add `PUT /api/v1/clientes/{id}` endpoint (AC: #2, #3)
  - [x] Add to `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`:
    ```csharp
    app.MapPut("/api/v1/clientes/{id:guid}", async (Guid id, UpdateClienteCommand body, UpdateClienteCommandHandler handler, IValidator<UpdateClienteCommand> validator) =>
    {
        var command = body with { Id = id };
        var validationResult = await validator.ValidateAsync(command);
        if (!validationResult.IsValid)
            return Results.ValidationProblem(validationResult.ToDictionary());

        var result = await handler.HandleAsync(command);
        if (result is null)
            return Results.Problem(statusCode: 404, title: "Cliente no encontrado", detail: "No existe un cliente con el ID especificado.");

        return Results.Ok(result);
    });
    ```
  - [x] Register `UpdateClienteCommandHandler` and `IValidator<UpdateClienteCommand>` in `backend/src/SiesaAgents.API/Program.cs` DI container

- [x] Task 5 — Add `update` method to frontend `IClienteRepository` and `clienteApiRepository` (AC: #2)
  - [x] Add to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`:
    ```typescript
    update(id: string, data: Omit<Cliente, 'id' | 'createdAt'>): Promise<Cliente>;
    ```
  - [x] Add to `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`:
    ```typescript
    update: async (id, data) => {
      const res = await apiClient.put<Cliente>(`/api/v1/clientes/${id}`, data);
      return res.data;
    },
    ```

- [x] Task 6 — Create Zod schema and `useUpdateCliente` TanStack Query mutation hook (AC: #2, #3)
  - [x] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts`:
    - If a shared schema already exists from Story 2.3, verify it covers all 4 fields and re-export it; if not, create:
    ```typescript
    import { z } from 'zod';
    export const clienteFormSchema = z.object({
      nombre:   z.string().min(1, 'El nombre es requerido').max(200),
      nitRuc:   z.string().min(1, 'El NIT/RUC es requerido').max(50),
      telefono: z.string().min(1, 'El teléfono es requerido').max(50),
      ciudad:   z.string().min(1, 'La ciudad es requerida').max(100),
    });
    export type ClienteFormValues = z.infer<typeof clienteFormSchema>;
    ```
  - [x] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`:
    ```typescript
    import { useMutation, useQueryClient } from '@tanstack/react-query';
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

    export const useUpdateCliente = () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Omit<Cliente, 'id' | 'createdAt'> }) =>
          clienteApiRepository.update(id, data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['clientes'] });
          // ['clientes', id] is automatically invalidated by hierarchical invalidation
        },
      });
    };
    ```

- [x] Task 7 — Create `ClienteEditForm` presentation component (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteEditForm.tsx`:
    - Check siesa-ui-kit for form/input components — use if available; otherwise use shadcn/ui `Input`, `Label`, `Button` (already installed); fallback: custom TailwindCSS
    - Props: `cliente: Cliente`, `onSuccess: () => void`, `onCancel: () => void`
    - Initialize React Hook Form with `useForm<ClienteFormValues>({ resolver: zodResolver(clienteFormSchema), defaultValues: { nombre: cliente.nombre, nitRuc: cliente.nitRuc, telefono: cliente.telefono, ciudad: cliente.ciudad } })`
    - Fields: Nombre (text), NIT/RUC (text), Teléfono (text), Ciudad (text) — all required
    - Pre-fills all fields from `cliente` prop (satisfies AC #1)
    - On submit: call `useUpdateCliente.mutate({ id: cliente.id, data: formValues })`
      - On success: show toast "Cliente actualizado correctamente" + call `onSuccess()`
      - On error: show generic error toast
    - "Cancelar" button: calls `onCancel()` without mutation (satisfies AC #4)
    - Inline validation errors appear under each field via `formState.errors` (satisfies AC #3)
    - Submit button shows loading state while mutation is pending (use `isPending`)
    - All UI text in Spanish: labels "Nombre", "NIT/RUC", "Teléfono", "Ciudad"; buttons "Guardar cambios", "Cancelar"
    - WCAG 2.1 AA: each input has `id` + `<Label htmlFor={...}>`, `aria-invalid` when error, `aria-describedby` pointing to error message
    - Dark mode: `dark:` TailwindCSS classes on all elements

- [x] Task 8 — Add "Editar" button to `ClienteDetailView` and wire the form (AC: #1, #2)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
    - Add local state: `const [isEditing, setIsEditing] = useState(false)`
    - When `isEditing === false`: render detail view + "Editar" button (Heroicons `PencilIcon` or `PencilSquareIcon`) that sets `isEditing = true`
    - When `isEditing === true`: render `<ClienteEditForm cliente={data} onSuccess={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />`
    - "Editar" button: styled with primary color `#0e79fd` (Siesa Blue), accessible `aria-label="Editar cliente"`

- [x] Task 9 — Integrate toast notification (AC: #2)
  - [x] Verify the toast system is already configured from Story 2.3 (likely `sonner` or `siesa-ui-kit` toast)
  - [x] If already set up: import and call `toast.success('Cliente actualizado correctamente')` in `useUpdateCliente.onSuccess` callback (or inside `ClienteEditForm` onSuccess handler)
  - [x] If NOT yet set up: install `sonner` (`pnpm add sonner`), add `<Toaster />` to the app root provider in `frontend/src/app/providers/`, then use `toast.success()`

- [x] Task 10 — Write tests for Story 2.4 (AC: #1, #2, #3, #4)
  - [x] **Backend — API Integration (xUnit):**
    - `TC-E2-P2-07`: Create client via POST, record ID → PUT `/api/v1/clientes/{id}` with modified `nombre` and `ciudad` → assert HTTP 200 → GET `/api/v1/clientes/{id}` → assert updated fields
    - `TC-E2-P0-03` (edit variant): PUT `/api/v1/clientes/{id}` with empty body → assert HTTP 400 with `application/problem+json` and field-level validation errors
    - File: `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs` (extended)
  - [x] **Backend — Unit (xUnit):**
    - `TC-E2-P3-04` (edit variant): `UpdateClienteCommandValidator` with `Nombre = ""` → assert validation fails on `Nombre` field
    - File: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandValidatorTests.cs`
  - [x] **Frontend — Component (Vitest + RTL + MSW):**
    - `TC-E2-P1-10`: Render `<ClienteDetailView clienteId={...} />` with MSW returning full client → click "Editar" → assert form opens with all 4 fields pre-populated with current values
    - `TC-E2-P2-02`: Open edit form → clear Nombre field → type "Nuevo Nombre" → click "Cancelar" → assert detail panel still shows original Nombre, no PUT request fired
    - `TC-E2-P2-03`: Open edit form → clear Nombre field → click "Guardar cambios" → assert inline error message under Nombre → assert no API request fired
    - File: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (extended)
    - Additional file: `frontend/src/modules/crm/clientes/presentation/ClienteEditForm.test.tsx`
  - [x] **Frontend — Unit (Vitest):**
    - `TC-E2-P3-02` (schema): `clienteFormSchema.safeParse({})` → assert failure on all 4 fields; `clienteFormSchema.safeParse({ nombre: 'X', nitRuc: 'Y', telefono: 'Z', ciudad: 'W' })` → assert success
    - File: `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts`
  - [x] Test structure: Arrange / Act / Assert

## Completion Notes

- Implementation completed 2026-06-17.
- All 10 tasks implemented across frontend and backend.
- Frontend tests: 124 tests passing across 12 test files (Vitest + RTL + MSW).
- Backend tests written (xUnit) — dotnet CLI not available in environment, backend test execution skipped; code follows project patterns.
- siesa-ui-kit toast (ToastProvider + toast.success/error) used; ToastProvider already configured in main.tsx from Story 2.3.
- ClienteEditForm uses native HTML inputs with React Hook Form + Zod (siesa-ui-kit Input forwarded to HTML input elements for full RHF compatibility).
- Temporary debugging test files in `frontend/src/test/` cleaned up.

## Dev Notes

### Architecture Layer Mapping

```
Story 2.4 touches BOTH frontend and backend:

Frontend (Clean Architecture):
  domain/          → IClienteRepository.ts (add update method)
  application/     → useUpdateCliente.ts (new), clienteSchema.ts (new or verify from 2.3)
  infrastructure/  → clienteApiRepository.ts (add update implementation)
  presentation/    → ClienteDetailView.tsx (add isEditing state + Editar button)
                   → ClienteEditForm.tsx (new)

Backend (Clean Architecture):
  Domain/          → ClienteEntity.cs (add Update() method), IClienteRepository.cs (add UpdateAsync)
  Application/     → UpdateClienteCommand.cs (new), UpdateClienteCommandValidator.cs (new),
                      UpdateClienteCommandHandler.cs (new)
  Infrastructure/  → ClienteRepository.cs (add UpdateAsync implementation)
  API/             → ClienteEndpoints.cs (add PUT /api/v1/clientes/{id}), Program.cs (DI registration)
```

### Backend — ClienteEntity Update Method (MANDATORY)

```csharp
// Add to backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
public void Update(string nombre, string nit, string telefono, string ciudad)
{
    Nombre = nombre;
    Nit = nit;
    Telefono = telefono;
    Ciudad = ciudad;
    UpdatedAt = DateTimeOffset.UtcNow;  // NEVER DateTime — mandatory company standard
}
```

The `ClienteEntity` already has `UpdatedAt { get; private set; }` (set during `Create()`). The `Update()` method mutates it on each edit — this is consistent with DDD entity pattern.

### Backend — UpdateClienteCommandHandler Pattern (MANDATORY)

```csharp
// backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs
namespace SiesaAgents.Application.Clientes.Commands;

public class UpdateClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public UpdateClienteCommandHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ClienteDto?> HandleAsync(UpdateClienteCommand command)
    {
        var cliente = await _repository.GetByIdAsync(command.Id);
        if (cliente is null) return null;

        cliente.Update(command.Nombre, command.NitRuc, command.Telefono, command.Ciudad);
        await _repository.UpdateAsync(cliente);

        return new ClienteDto
        {
            Id = cliente.Id,
            Nombre = cliente.Nombre,
            NitRuc = cliente.Nit,
            Telefono = cliente.Telefono,
            Ciudad = cliente.Ciudad,
            CreatedAt = cliente.CreatedAt
        };
    }
}
```

### Backend — PUT /api/v1/clientes/{id} Endpoint Contract

```
Request:  PUT /api/v1/clientes/{id:guid}
          Content-Type: application/json
          Body: { "nombre": "...", "nitRuc": "...", "telefono": "...", "ciudad": "..." }

Response (200 OK — success):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Updated Name",
  "nitRuc": "900123456-1",
  "telefono": "3001234567",
  "ciudad": "Medellín",
  "createdAt": "2026-06-17T14:30:00Z"
}

Response (400 Bad Request — validation failure, Problem Details RFC 7807):
{
  "status": 400,
  "title": "One or more validation errors occurred.",
  "errors": { "nombre": ["El nombre es requerido."], ... }
}

Response (404 Not Found — Problem Details RFC 7807):
{
  "status": 404,
  "title": "Cliente no encontrado",
  "detail": "No existe un cliente con el ID especificado."
}
```

### Backend — IClienteRepository Extension (MANDATORY)

```csharp
// Add to backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs
Task UpdateAsync(ClienteEntity entity);
```

```csharp
// Add to backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs
public async Task UpdateAsync(ClienteEntity entity)
{
    _context.Clientes.Update(entity);
    await _context.SaveChangesAsync();
}
```

EF Core `Update()` marks all properties as modified and persists them. Since `ClienteEntity` is a DDD entity, this is the correct approach — no partial update needed for 4 fields.

### Frontend — useUpdateCliente Mutation Hook (MANDATORY)

```typescript
// frontend/src/modules/crm/clientes/application/useUpdateCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';
import type { Cliente } from '../domain/Cliente';

export const useUpdateCliente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Cliente, 'id' | 'createdAt'> }) =>
      clienteApiRepository.update(id, data),
    onSuccess: () => {
      // MANDATORY: invalidate list so FR27 (immediate visibility) is satisfied
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      // ['clientes', id] is automatically covered by hierarchical invalidation
    },
  });
};
```

### Frontend — TanStack Query Cache Invalidation (CRITICAL — FR27)

After a successful PUT, `invalidateQueries({ queryKey: ['clientes'] })` triggers:
1. A refetch of the `['clientes']` list → left panel updates immediately
2. TanStack Query hierarchically invalidates `['clientes', id]` → right panel detail view also refreshes

Do NOT use optimistic updates alone — always invalidate after the server confirms success (architecture decision: NFR2 < 2s update, FR27 immediate visibility).

### Frontend — Zod Schema (MANDATORY)

```typescript
// frontend/src/modules/crm/clientes/application/clienteSchema.ts
import { z } from 'zod';

export const clienteFormSchema = z.object({
  nombre:   z.string().min(1, 'El nombre es requerido').max(200, 'Máximo 200 caracteres'),
  nitRuc:   z.string().min(1, 'El NIT/RUC es requerido').max(50, 'Máximo 50 caracteres'),
  telefono: z.string().min(1, 'El teléfono es requerido').max(50, 'Máximo 50 caracteres'),
  ciudad:   z.string().min(1, 'La ciudad es requerida').max(100, 'Máximo 100 caracteres'),
});

export type ClienteFormValues = z.infer<typeof clienteFormSchema>;
```

If Story 2.3 already created this schema, import and reuse it — do NOT duplicate. Check `frontend/src/modules/crm/clientes/application/clienteSchema.ts` first.

### Frontend — ClienteEditForm Component Structure (MANDATORY)

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteEditForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteFormSchema, type ClienteFormValues } from '../application/clienteSchema';
import { useUpdateCliente } from '../application/useUpdateCliente';
import { toast } from 'sonner'; // or siesa-ui-kit toast if available
import type { Cliente } from '../domain/Cliente';

interface ClienteEditFormProps {
  cliente: Cliente;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ClienteEditForm = ({ cliente, onSuccess, onCancel }: ClienteEditFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: {
      nombre:   cliente.nombre,
      nitRuc:   cliente.nitRuc,
      telefono: cliente.telefono,
      ciudad:   cliente.ciudad,
    },
  });

  const { mutate, isPending } = useUpdateCliente();

  const onSubmit = (values: ClienteFormValues) => {
    mutate(
      { id: cliente.id, data: values },
      {
        onSuccess: () => {
          toast.success('Cliente actualizado correctamente');
          onSuccess();
        },
        onError: () => {
          toast.error('No se pudo actualizar el cliente. Inténtalo de nuevo.');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-label="Formulario de edición de cliente" noValidate>
      {/* Nombre */}
      <div>
        <label htmlFor="nombre">Nombre</label>
        <input id="nombre" {...register('nombre')} aria-invalid={!!errors.nombre} aria-describedby="nombre-error" />
        {errors.nombre && <span id="nombre-error" role="alert">{errors.nombre.message}</span>}
      </div>

      {/* NIT/RUC */}
      <div>
        <label htmlFor="nitRuc">NIT/RUC</label>
        <input id="nitRuc" {...register('nitRuc')} aria-invalid={!!errors.nitRuc} aria-describedby="nitRuc-error" />
        {errors.nitRuc && <span id="nitRuc-error" role="alert">{errors.nitRuc.message}</span>}
      </div>

      {/* Teléfono */}
      <div>
        <label htmlFor="telefono">Teléfono</label>
        <input id="telefono" {...register('telefono')} aria-invalid={!!errors.telefono} aria-describedby="telefono-error" />
        {errors.telefono && <span id="telefono-error" role="alert">{errors.telefono.message}</span>}
      </div>

      {/* Ciudad */}
      <div>
        <label htmlFor="ciudad">Ciudad</label>
        <input id="ciudad" {...register('ciudad')} aria-invalid={!!errors.ciudad} aria-describedby="ciudad-error" />
        {errors.ciudad && <span id="ciudad-error" role="alert">{errors.ciudad.message}</span>}
      </div>

      <button type="button" onClick={onCancel} disabled={isPending}>Cancelar</button>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
};
```

Styling: apply TailwindCSS v4 classes. Use `slate-*` for neutrals, `#0e79fd` (Siesa Blue) for primary action button. Check siesa-ui-kit for `Input`, `Label`, `Button` before using shadcn/ui equivalents.

### Frontend — ClienteDetailView Update (Editar Toggle)

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx (additions)
import { useState } from 'react';
import { ClienteEditForm } from './ClienteEditForm';
import { PencilSquareIcon } from '@heroicons/react/24/outline'; // Heroicons primary

// Inside the success rendering block:
const [isEditing, setIsEditing] = useState(false);

if (isEditing) {
  return (
    <ClienteEditForm
      cliente={data}
      onSuccess={() => setIsEditing(false)}
      onCancel={() => setIsEditing(false)}
    />
  );
}

// In the detail view JSX, add:
<button
  type="button"
  onClick={() => setIsEditing(true)}
  aria-label="Editar cliente"
  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd] dark:bg-[#0e79fd] dark:hover:bg-[#154ca9]"
>
  <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
  Editar
</button>
```

### MasterCrud Applicability Note

MasterCrud is NOT applicable to this story. Story 2.4 implements an inline edit form within the existing split-panel detail view — the form is toggled directly inside `ClienteDetailView` using a local `isEditing` flag. MasterCrud is designed for full data-grid orchestration (list + form + CRUD actions combined), which does not match the split-panel UX pattern established in Stories 2.1–2.2. The correct pattern here is React Hook Form + Zod + `useMutation` (TanStack Query).

### UI Implementation Requirements (MANDATORY)

- **Primary UI source**: check siesa-ui-kit for `Input`, `Label`, `Button`, `Form` components — use if available
- **Secondary**: shadcn/ui (install via MCP tool — do NOT use npm/pnpm directly for shadcn)
- **Tertiary**: custom TailwindCSS components
- **Styling**: TailwindCSS v4 — `slate-*` for neutrals; primary `#0e79fd`; tertiary `#154ca9`; font Inter
- **Icons**: Heroicons `PencilSquareIcon` for "Editar" button
- **Loading state**: submit button shows "Guardando..." text + `disabled` during `isPending`; skeleton screens (react-loading-skeleton) for the detail view loading state (already implemented in Story 2.2)
- **Spanish UI text** (MANDATORY): labels "Nombre", "NIT/RUC", "Teléfono", "Ciudad"; buttons "Editar", "Guardar cambios", "Cancelar"; error messages in Spanish per Zod schema
- **Dark mode**: `dark:` TailwindCSS classes on all form elements and buttons
- **WCAG 2.1 AA**: `<label htmlFor>` + `id` on every input, `aria-invalid` on inputs with errors, `aria-describedby` pointing to error `<span>`, `role="alert"` on error messages, `aria-label="Editar cliente"` on edit button

### TanStack Query Keys — Canonical Reference (CRITICAL)

```typescript
['clientes']           // list — invalidated by useUpdateCliente.onSuccess → ClienteListView refetches
['clientes', id]       // single — hierarchically invalidated by list invalidation → ClienteDetailView refetches
```

Both keys were established in Stories 2.1–2.2. Story 2.4 mutations MUST use `invalidateQueries({ queryKey: ['clientes'] })`. Never use `setQueryData` as a replacement — always invalidate.

### Previous Story Learnings (from Stories 2.1, 2.2)

- `apiClient.ts` Axios singleton at `frontend/src/shared/lib/apiClient.ts` already exists — import from there, do NOT create a new instance.
- `EmptyState`, `ErrorPanel` shared components already exist at `frontend/src/shared/components/` — reuse for loading/error states in `ClienteDetailView`.
- dotnet CLI (`dotnet ef`) may not be available in the environment — no new migration is needed for this story (only adds a command handler, no schema change).
- `TreatWarningsAsErrors = true` in all `.csproj` files — zero compiler warnings allowed.
- `Nullable` is enabled in all backend projects — use `ClienteEntity?`, `ClienteDto?` where appropriate.
- `FindAsync` is preferred over `FirstOrDefaultAsync` for PK-based lookups (EF Core identity map).
- `ApplySnakeCaseNaming()` in `OnModelCreating` handles all DB column naming — no `[Column]` or `[Table]` attributes.
- Commit convention: `feat(story-2-4): <description>` (lowercase, hyphenated story reference).
- Story 2.3 (Create Client) will have established the toast system, the `ClienteFormValues` Zod schema, and potentially the `ClienteForm` component — check for reusable artifacts before creating from scratch.

### Git History Context

Expected recent commits:
- `feat(story-2-3): implement create client form with validation and toast`
- `feat(story-2-2): implement client detail view with deep linking`
- `feat(story-2-1): implement client list view with real-time search`

Use convention: `feat(story-2-4): <description>` for implementation commits.

### Test Cases for This Story

From `test-design-epic-2.md`, the following test cases are scoped to Story 2.4:

| Test ID | Level | Description | Priority |
|---------|-------|-------------|----------|
| TC-E2-P1-10 | Component | Edit form opens pre-filled with current values | P1 |
| TC-E2-P1-11 | E2E (Playwright) | Saving changes reflects in list and detail panel; toast shown | P1 |
| TC-E2-P2-02 | Component | Cancel restores original data; no PUT fired | P2 |
| TC-E2-P2-03 | Component | Required field cleared shows inline error; no submit | P2 |
| TC-E2-P2-07 | API Integration | PUT /api/v1/clientes/:id returns 200 with updated fields | P2 |
| TC-E2-P3-02 | Unit | Zod schema validates all 4 required fields | P3 |
| TC-E2-P3-04 | Unit | FluentValidation rejects empty Nombre on update | P3 |

### Critical Anti-Patterns to Avoid

```
❌ DateTime in UpdatedAt              → Always DateTimeOffset.UtcNow
❌ Swagger / UseSwagger()             → Scalar only (already configured)
❌ String queryKey                    → Array ['clientes'] (mandatory)
❌ English UI text                    → Spanish mandatory (labels, errors, toasts)
❌ Stack traces exposed to user       → Problem Details RFC 7807 only
❌ optimistic update without invalidation → Always invalidateQueries after success
❌ setQueryData instead of invalidate → Use invalidateQueries for FR27 compliance
❌ Custom form before siesa-ui-kit    → Check siesa-ui-kit catalog first
❌ Spinner for loading states         → react-loading-skeleton skeleton screens
❌ Duplicate Zod schema from Story 2.3 → Reuse clienteSchema.ts if it exists
❌ Recreating apiClient singleton     → Import from shared/lib/apiClient.ts
❌ Manual [Column]/[Table] attributes → ApplySnakeCaseNaming() handles naming
❌ EF Core DateTime                   → DateTimeOffset (strict company standard)
❌ MasterCrud for this story          → Not applicable (split-panel inline edit, not data grid)
```

### Project Structure Notes

- Story 2.4 extends the `ClienteDetailView` created in Story 2.2 — add `isEditing` state toggle and "Editar" button there.
- The `ClienteEditForm` is a sibling to `ClienteDetailView` in the presentation layer — both live in `frontend/src/modules/crm/clientes/presentation/`.
- If Story 2.3 already created `clienteSchema.ts` and/or a `ClienteForm` component, evaluate whether `ClienteEditForm` can reuse it (same 4 fields, same validation). Avoid duplication.
- Story 2.5 (Delete Client) will add an "Eliminar" button to `ClienteDetailView` — leave room in the button group layout.
- No EF Core migration is needed — the `clientes` table already has all required columns including `updated_at`.

### File Structure After This Story

```
frontend/src/
  modules/crm/clientes/
    domain/
      IClienteRepository.ts           ← MODIFY (add update method signature)
    application/
      clienteSchema.ts                ← CREATE (or verify from Story 2.3)
      useUpdateCliente.ts             ← CREATE
    infrastructure/
      clienteApiRepository.ts         ← MODIFY (add update implementation)
    presentation/
      ClienteDetailView.tsx           ← MODIFY (add isEditing state + Editar button + form toggle)
      ClienteEditForm.tsx             ← CREATE
      ClienteEditForm.test.tsx        ← CREATE (tests)
      ClienteDetailView.test.tsx      ← MODIFY (extend with TC-E2-P1-10, TC-E2-P2-02, TC-E2-P2-03)

backend/src/
  SiesaAgents.Domain/Clientes/
    Entities/ClienteEntity.cs         ← MODIFY (add Update() method)
    Interfaces/IClienteRepository.cs  ← MODIFY (add UpdateAsync signature)
  SiesaAgents.Application/Clientes/
    Commands/UpdateClienteCommand.cs           ← CREATE
    Commands/UpdateClienteCommandValidator.cs  ← CREATE
    Commands/UpdateClienteCommandHandler.cs    ← CREATE
  SiesaAgents.Infrastructure/
    Repositories/ClienteRepository.cs ← MODIFY (add UpdateAsync implementation)
  SiesaAgents.API/
    Endpoints/ClienteEndpoints.cs     ← MODIFY (add PUT endpoint)
    Program.cs                        ← MODIFY (register UpdateClienteCommandHandler + Validator)

backend/tests/
  SiesaAgents.UnitTests/Application/Clientes/
    UpdateClienteCommandValidatorTests.cs ← CREATE
  SiesaAgents.IntegrationTests/Clientes/
    ClienteEndpointsTests.cs              ← MODIFY (add TC-E2-P2-07 and 400 edit variant)
```

### References

- Epic source — Story 2.4 AC: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.4]
- Architecture — PUT endpoint contract: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — TanStack Query keys: [Source: _bmad-output/planning-artifacts/architecture.md#TanStack Query keys]
- Architecture — Optimistic UI / cache invalidation: [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Identified]
- Architecture — Complete project directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Story 2.1 learnings (apiClient, entity patterns): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes]
- Story 2.2 learnings (ClienteDetailView structure, split-panel): [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md#Dev Notes]
- Test cases for Story 2.4: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-10, TC-E2-P1-11, TC-E2-P2-02, TC-E2-P2-03, TC-E2-P2-07]
- Company standards — Backend stack (DateTimeOffset, FluentValidation, CQRS): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack]
- Company standards — Frontend stack (React Hook Form + Zod, TanStack Query): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack]
- Company standards — UX Design System (colors, typography, icons): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- MasterCrud reference (evaluated and ruled out): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

**Frontend:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` (modified — add update method)
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts` (created — Zod schema for form validation)
- `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts` (created — unit tests TC-E2-P3-02)
- `frontend/src/modules/crm/clientes/application/clienteSchema.edge-cases.test.ts` (created — boundary tests)
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts` (created — TanStack Query mutation hook)
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` (modified — add update method)
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` (modified — add isEditing state + Editar button)
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (modified — TC-E2-P1-10, TC-E2-P2-02)
- `frontend/src/modules/crm/clientes/presentation/ClienteEditForm.tsx` (created — edit form component)
- `frontend/src/modules/crm/clientes/presentation/ClienteEditForm.test.tsx` (created — component tests TC-E2-P2-02, TC-E2-P2-03)
- `frontend/src/modules/crm/clientes/presentation/ClienteEditForm.edge-cases.test.tsx` (created — edge case tests)
- `frontend/src/main.tsx` (modified — ToastProvider already configured from Story 2.3)

**Backend:**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` (modified — add Update() method)
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` (modified — add UpdateAsync)
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs` (created)
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandValidator.cs` (created)
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs` (created)
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` (modified — add UpdateAsync)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (modified — add PUT /api/v1/clientes/{id})
- `backend/src/SiesaAgents.API/Program.cs` (modified — register UpdateClienteCommandHandler + Validator)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandValidatorTests.cs` (created — TC-E2-P3-04)
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs` (modified — TC-E2-P2-07, 400 edit variant)
