# Story 2.3: Create Client

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new client by filling in a form,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a form opens with fields: Nombre, NIT/RUC, Teléfono, Ciudad (all required per FR1). (AC-E2.1, FR1)

2. **Given** the user fills all required fields and submits, **When** the form is submitted, **Then** the client is created and appears in the client list immediately (FR27), **And** a toast de éxito muestra "Cliente creado correctamente". (AC-E2.1, FR27, NFR2)

3. **Given** the user submits the form with one or more required fields empty, **When** the form is validated, **Then** clear inline error messages appear on the empty fields (FR8), **And** the form is NOT submitted to the backend. (AC-E2.4, FR8)

4. **Given** the user submits a NIT/RUC that already exists in the system, **When** the backend returns a 409 conflict, **Then** an error message indicates "El NIT/RUC ya está registrado" without exposing technical details (NFR6). (AC-E2.3, R-002)

## Tasks / Subtasks

- [x] Task 1 — Backend: Create `POST /api/v1/clientes` endpoint (AC: #1, #2, #4)
  - [x] Create `CreateClienteRequest.cs` in `backend/src/SiesaAgents.Application/Clientes/DTOs/` — fields: `Nombre (string)`, `Nit (string)`, `Telefono (string)`, `Ciudad (string)`
  - [x] Create `CreateClienteRequestValidator.cs` in `backend/src/SiesaAgents.Application/Clientes/Validators/` using FluentValidation — `.NotEmpty()` on all four fields; `.MaximumLength(200)` on Nombre, `.MaximumLength(50)` on Nit, `.MaximumLength(50)` on Telefono, `.MaximumLength(100)` on Ciudad
  - [x] Create `CreateClienteCommand.cs` + `CreateClienteCommandHandler.cs` in `backend/src/SiesaAgents.Application/Clientes/Commands/` — handler calls `IClienteRepository.AddAsync(entity)` and returns `ClienteDto`
  - [x] Add `AddAsync(ClienteEntity entity): Task<ClienteEntity>` to `IClienteRepository` interface in `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs`
  - [x] Implement `AddAsync` in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` using EF Core — `_context.Clientes.Add(entity); await _context.SaveChangesAsync(); return entity;`
  - [x] Add static `Create(string nombre, string nit, string telefono, string ciudad)` factory method to `ClienteEntity` in `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` if not already present — sets `Id = Guid.NewGuid()`, `CreatedAt = DateTimeOffset.UtcNow`, `UpdatedAt = DateTimeOffset.UtcNow`
  - [x] Register endpoint `POST /api/v1/clientes` in `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — validates request via `CreateClienteRequestValidator`, returns `201 Created` with `ClienteDto` on success, `400 Bad Request` with Problem Details on validation failure, `409 Conflict` with `{ title: "El NIT/RUC ya está registrado.", status: 409 }` on duplicate NIT (catch `DbUpdateException` with unique constraint violation)
  - [x] Register `CreateClienteCommandHandler` and `CreateClienteRequestValidator` as `Scoped` in `backend/src/SiesaAgents.API/Program.cs` (same pattern as existing handlers)

- [x] Task 2 — Backend: Tests for `POST /api/v1/clientes` (AC: #2, #3, #4)
  - [x] Unit test `CreateClienteCommandHandlerTests.cs` in `backend/tests/SiesaAgents.UnitTests/Application/Clientes/` — test cases: valid request → returns `ClienteDto` with all fields, `AddAsync` called once; handler maps `DateTimeOffset` correctly
  - [x] Backend integration test in `backend/tests/SiesaAgents.UnitTests/Integration/ClienteEndpointsTests.cs` — extend existing file with: POST valid payload → 201 + correct shape (all fields present, `id` is UUID, `createdAt` ISO 8601 with timezone offset); POST with missing Nombre → 400 Problem Details; POST duplicate NIT → 409 with `title` field (no `stackTrace` in response body)

- [x] Task 3 — Frontend: Application layer — Zod schema and `useCreateCliente` mutation hook (AC: #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts` — Zod schema: `z.object({ nombre: z.string().min(1, 'El nombre es requerido'), nit: z.string().min(1, 'El NIT/RUC es requerido'), telefono: z.string().min(1, 'El teléfono es requerido'), ciudad: z.string().min(1, 'La ciudad es requerida') })`; export `ClienteFormData` type inferred from schema
  - [x] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts` — TanStack Query mutation hook using `useMutation({ mutationFn: (data: ClienteFormData) => clienteApiRepository.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); toast.success('Cliente creado correctamente'); }, onError: (error) => { /* map 409 AxiosError to inline field error via onError callback; other errors toast 'No se pudo crear el cliente. Intenta de nuevo.' */ } })`; export `{ mutate, isPending, isError, error }`
  - [x] Add `create(data: ClienteFormData): Promise<Cliente>` method to `IClienteRepository` interface in `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
  - [x] Implement `create` in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — Axios POST to `/api/v1/clientes`; return `response.data` as `Cliente`

- [x] Task 4 — Frontend: Presentation layer — `ClienteForm` component (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`:
    - Props: `onSuccess?: () => void; onCancel?: () => void`
    - Uses React Hook Form (`useForm<ClienteFormData>`) + Zod resolver (`zodResolver(clienteSchema)`)
    - Fields: Nombre, NIT/RUC, Teléfono, Ciudad — all `<input>` with `register(...)` and inline error messages (`{errors.nombre && <span>{errors.nombre.message}</span>}`)
    - Submit button: "Guardar cliente" — disabled while `isPending`
    - Cancel button: "Cancelar" — calls `onCancel()`
    - On form submit: calls `mutate(data)`; on `mutate` success: calls `onSuccess()` and closes/resets
    - On 409 error from mutation: sets NIT field error via `setError('nit', { message: 'El NIT/RUC ya está registrado' })` — no toast for this case
    - Loading state: submit button shows "Guardando…" text while `isPending`
    - All user-facing text in Spanish: field labels, placeholder texts, error messages, button labels
    - WCAG 2.1 AA: all inputs have `<label>` with `htmlFor`; error messages associated via `aria-describedby`; submit button has accessible label; touch targets ≥ 44×44px
    - Check siesa-ui-kit for form/dialog/drawer components before using shadcn Dialog
  - [x] Verify available shadcn Dialog component (installed in Story 1.1 via `npx shadcn@latest add dialog`) for the modal container — use it if siesa-ui-kit has no dialog equivalent

- [x] Task 5 — Frontend: Wire "Nuevo cliente" button in `ClienteListView` (AC: #1)
  - [x] Modify `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — add "Nuevo cliente" button above or in the search bar area; clicking it sets `isCreating` state (`useState(false)`) to `true`
  - [x] When `isCreating` is `true`, render `<ClienteForm onSuccess={() => setIsCreating(false)} onCancel={() => setIsCreating(false)} />` inside a Dialog (shadcn) overlay
  - [x] Use Heroicons `PlusIcon` for the button icon

- [x] Task 6 — Tests: Unit and component tests (AC: #1, #2, #3, #4)
  - [x] Unit test `clienteSchema.test.ts` — assert: all empty fields fail validation with expected Spanish messages; all filled fields pass; nit empty gives 'El NIT/RUC es requerido'
  - [x] Unit test `useCreateCliente.test.ts` — mock `clienteApiRepository.create`; assert: success path calls `invalidateQueries(['clientes'])` and emits success toast; 409 error propagates correctly without generic toast
  - [x] Component test `ClienteForm.test.tsx` (RTL + MSW):
    - [x] TC-2.3-C-01 (P0): Submit form with all empty fields, assert inline error messages on all 4 fields and no API call fired (R-002)
    - [x] TC-2.3-C-02 (P0): Mock POST 409 response, submit with duplicate NIT, assert "El NIT/RUC ya está registrado" on NIT field, no toast shown, no stack trace in DOM (R-002)
    - [x] TC-2.3-C-03 (P1): Mock POST 201 response, submit valid form, assert `onSuccess` called and toast "Cliente creado correctamente"
    - [x] TC-2.3-C-04 (P1): Click "Cancelar" without filling form, assert `onCancel` called and form not submitted
    - [x] TC-2.3-C-05 (P1): While `isPending=true`, assert submit button is disabled and shows "Guardando…"

## Dev Notes

### Architecture Decisions Applied

- **Clean Architecture layers strictly enforced:** `domain/` updates `IClienteRepository` interface only; `application/` adds `clienteSchema.ts` and `useCreateCliente.ts`; `infrastructure/` adds `create` to the Axios adapter; `presentation/` adds `ClienteForm.tsx`. [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`]
- **TanStack Query mutation invalidation:** After successful create, `invalidateQueries({ queryKey: ['clientes'] })` is mandatory to satisfy FR27 (changes visible immediately to all users). [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- **409 conflict handling:** Backend `ExceptionHandlingMiddleware` catches `DbUpdateException` when unique constraint on `nit` is violated and returns `409 Conflict` with Problem Details. Frontend `useCreateCliente` inspects `error.response.status === 409` and calls `setError('nit', ...)` on the form — no generic toast for this case. [Source: `_bmad-output/planning-artifacts/architecture.md#Format Patterns`, NFR6]
- **Frontend validation is pre-submission guard only:** Zod + React Hook Form blocks empty-field submission on the client before any API call. Backend FluentValidation is the authoritative validation gate (defense-in-depth, NFR5). [Source: `_bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions`]
- **No optimistic updates for create:** Client-side cache does not pre-insert the new record. The mutation waits for `201 Created` then invalidates the `['clientes']` query, triggering a fresh `GET /api/v1/clientes` fetch. This guarantees the new record has the server-assigned `id` and timestamps. [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- **Form in Dialog overlay:** The create form opens in a Dialog modal (shadcn `Dialog` component) over the two-panel layout — no routing change needed. URL stays `/clientes` during creation. [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]

### UI Implementation Requirements (MANDATORY)

- **Primary library:** `siesa-ui-kit` — check catalog for `Form`, `Dialog`, `Drawer`, `FormField`, or `Modal` components before building custom markup
- **Fallback:** `shadcn/ui` Dialog component (already installed from Story 1.1) for the modal container
- **Constraint:** Do NOT create custom modal/dialog if shadcn Dialog is available
- **Icons:** Heroicons `PlusIcon` for "Nuevo cliente" button. [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Icons`]
- **Toast:** Use the toast utility already wired in the app from previous stories (check `src/app/providers/` for the Toaster provider and the `toast` import)
- **Form inputs:** Use shadcn `Input`, `Label`, and `Button` components if siesa-ui-kit equivalents are not found

### Project Structure Notes

```
frontend/src/
  modules/
    crm/
      clientes/
        domain/
          IClienteRepository.ts        # MODIFY: add create(data: ClienteFormData): Promise<Cliente>
        application/
          clienteSchema.ts             # NEW: Zod schema + ClienteFormData type
          useCreateCliente.ts          # NEW: TanStack mutation hook
        infrastructure/
          clienteApiRepository.ts      # MODIFY: implement create via Axios POST /api/v1/clientes
        presentation/
          ClienteForm.tsx              # NEW: React Hook Form + Zod create form
          ClienteListView.tsx          # MODIFY: add "Nuevo cliente" button + Dialog state

backend/
  src/
    SiesaAgents.Domain/
      Clientes/
        Entities/
          ClienteEntity.cs             # MODIFY: add static Create() factory if missing
    SiesaAgents.Application/
      Clientes/
        Commands/
          CreateClienteCommand.cs      # NEW
          CreateClienteCommandHandler.cs  # NEW
        DTOs/
          CreateClienteRequest.cs      # NEW
        Validators/
          CreateClienteRequestValidator.cs  # NEW
        Interfaces/
          IClienteRepository.cs        # MODIFY: add AddAsync(ClienteEntity): Task<ClienteEntity>
    SiesaAgents.Infrastructure/
      Repositories/
        ClienteRepository.cs           # MODIFY: implement AddAsync
    SiesaAgents.API/
      Endpoints/
        ClienteEndpoints.cs            # MODIFY: register POST /api/v1/clientes
      Program.cs                       # MODIFY: register CreateClienteCommandHandler + Validator as Scoped
  tests/
    SiesaAgents.UnitTests/
      Application/
        Clientes/
          CreateClienteCommandHandlerTests.cs  # NEW
      Integration/
        ClienteEndpointsTests.cs       # MODIFY: add POST tests
```

### Key Patterns and Constraints

**Backend `IClienteRepository` extension:**
```csharp
// SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs
public interface IClienteRepository
{
    Task<IEnumerable<ClienteEntity>> GetAllAsync();
    Task<ClienteEntity?> GetByIdAsync(Guid id);
    Task<ClienteEntity> AddAsync(ClienteEntity entity);  // NEW
}
```

**Backend `ClienteEntity.Create()` factory:**
```csharp
// SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
{
    return new ClienteEntity
    {
        Id = Guid.NewGuid(),
        Nombre = nombre,
        Nit = nit,
        Telefono = telefono,
        Ciudad = ciudad,
        CreatedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
    };
}
```

**Backend endpoint (201 Created + 409 Conflict):**
```csharp
// ClienteEndpoints.cs — add inside MapClienteEndpoints():
group.MapPost("/", CreateCliente);

private static async Task<IResult> CreateCliente(
    CreateClienteRequest request,
    CreateClienteRequestValidator validator,
    CreateClienteCommandHandler handler)
{
    var validation = await validator.ValidateAsync(request);
    if (!validation.IsValid)
        return Results.ValidationProblem(validation.ToDictionary());

    try
    {
        var result = await handler.Handle(new CreateClienteCommand(request));
        return Results.Created($"/api/v1/clientes/{result.Id}", result);
    }
    catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("uk_clientes_nit") == true)
    {
        return Results.Conflict(new { title = "El NIT/RUC ya está registrado.", status = 409 });
    }
}
```

**Frontend Zod schema:**
```typescript
// frontend/src/modules/crm/clientes/application/clienteSchema.ts
import { z } from 'zod';

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  nit: z.string().min(1, 'El NIT/RUC es requerido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  ciudad: z.string().min(1, 'La ciudad es requerida'),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
```

**Frontend `useCreateCliente` mutation hook:**
```typescript
// frontend/src/modules/crm/clientes/application/useCreateCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';
import type { ClienteFormData } from './clienteSchema';
import { toast } from '...'; // resolve from existing app provider

export function useCreateCliente(
  setNitError?: (message: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClienteFormData) => clienteApiRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente creado correctamente');
    },
    onError: (error) => {
      const axiosError = error as import('axios').AxiosError;
      if (axiosError?.response?.status === 409) {
        setNitError?.('El NIT/RUC ya está registrado');
      } else {
        toast.error('No se pudo crear el cliente. Intenta de nuevo.');
      }
    },
  });
}
```

**Frontend `ClienteForm` (key usage pattern):**
```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteSchema, type ClienteFormData } from '../application/clienteSchema';
import { useCreateCliente } from '../application/useCreateCliente';

export function ClienteForm({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) {
  const { register, handleSubmit, formState: { errors }, setError } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
  });

  const { mutate, isPending } = useCreateCliente(
    (msg) => setError('nit', { message: msg })
  );

  const onSubmit = (data: ClienteFormData) => {
    mutate(data, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Nombre */}
      <label htmlFor="nombre">Nombre</label>
      <input id="nombre" {...register('nombre')} aria-describedby="nombre-error" />
      {errors.nombre && <span id="nombre-error">{errors.nombre.message}</span>}
      {/* NIT/RUC */}
      <label htmlFor="nit">NIT/RUC</label>
      <input id="nit" {...register('nit')} aria-describedby="nit-error" />
      {errors.nit && <span id="nit-error">{errors.nit.message}</span>}
      {/* Teléfono */}
      <label htmlFor="telefono">Teléfono</label>
      <input id="telefono" {...register('telefono')} aria-describedby="telefono-error" />
      {errors.telefono && <span id="telefono-error">{errors.telefono.message}</span>}
      {/* Ciudad */}
      <label htmlFor="ciudad">Ciudad</label>
      <input id="ciudad" {...register('ciudad')} aria-describedby="ciudad-error" />
      {errors.ciudad && <span id="ciudad-error">{errors.ciudad.message}</span>}

      <button type="button" onClick={onCancel}>Cancelar</button>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Guardando…' : 'Guardar cliente'}
      </button>
    </form>
  );
}
```

**Frontend "Nuevo cliente" button in `ClienteListView`:**
```typescript
// In ClienteListView.tsx — add state and Dialog wrapper
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusIcon } from '@heroicons/react/24/outline';
import { ClienteForm } from './ClienteForm';

const [isCreating, setIsCreating] = useState(false);

// In JSX — above search input:
<button onClick={() => setIsCreating(true)}>
  <PlusIcon className="h-4 w-4" />
  Nuevo cliente
</button>

<Dialog open={isCreating} onOpenChange={setIsCreating}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Nuevo cliente</DialogTitle>
    </DialogHeader>
    <ClienteForm
      onSuccess={() => setIsCreating(false)}
      onCancel={() => setIsCreating(false)}
    />
  </DialogContent>
</Dialog>
```

### Previous Story Learnings (from Stories 2.1 and 2.2)

- **MediatR not installed** — Continue using direct handler injection pattern. Register `CreateClienteCommandHandler` and `CreateClienteRequestValidator` as `Scoped` in `Program.cs` exactly as done for existing handlers. [Source: `2-1-client-list-search.md#Completion Notes List`]
- **siesa-ui-kit does not include `EmptyState`, `ErrorPanel`, form/dialog components** — Only `FormCacheSelector` available. Use shadcn `Dialog` (already installed) for the modal container. [Source: `2-2-client-detail-view.md#Completion Notes List`]
- **`@testing-library/user-event` already added** — No need to add again. [Source: `2-1-client-list-search.md#Completion Notes List`]
- **`apiClient` already has `?? 'http://localhost:5000'` fallback** — MSW will work correctly in tests. [Source: `2-1-client-list-search.md#Completion Notes List`]
- **dotnet SDK not available** — Backend tests must be authored and verified by code inspection; cannot be executed in this environment. Document in Completion Notes. [Source: `2-1-client-list-search.md#Completion Notes List`]
- **Two-panel layout shell in place** — `frontend/src/routes/_app/clientes.tsx` renders `ClienteListView` (280px left) + `<Outlet />` (right). `ClienteListView.tsx` is the correct file to add the "Nuevo cliente" button. [Source: `2-2-client-detail-view.md#Completion Notes List`]
- **Toast provider** — Verify the Toaster is mounted in `src/app/providers/` or `__root.tsx` from Story 1.2 setup before using `toast.success()`. Confirm the correct import path for `toast`.

### Git History Context

Follow the naming pattern established in previous stories:
- `feat(story-2.3): implement create client form (frontend + backend)`
- `test(story-2.3): add ATDD tests for create client — all levels`
- `fix(review-2.3): apply code review auto-corrections`

### References

- Architecture decisions and mutation patterns: [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- API endpoint `POST /api/v1/clientes`: [Source: `_bmad-output/planning-artifacts/architecture.md#REST Endpoints`]
- Epic acceptance criteria and story requirements: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.3`]
- FR1 (required fields: Nombre, NIT/RUC, Teléfono, Ciudad), FR8 (validation), FR27 (immediate reflection): [Source: `_bmad-output/planning-artifacts/prd/functional-requirements.md`]
- NFR2 (CRUD < 2s), NFR5 (sanitization), NFR6 (no stack traces): [Source: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`]
- R-002 (duplicate NIT/RUC not surfaced as inline error — HIGH risk): [Source: `_bmad-output/test-design-epic-2.md#Risk Assessment`]
- Test design for Story 2.3 (P0 + P1): [Source: `_bmad-output/test-design-epic-2.md#Story 2.3`]
- Company standards (TypeScript strict, DateTimeOffset, snake_case, Spanish UI): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]
- Previous story patterns (handler injection, siesa-ui-kit availability, apiClient setup): [Source: `_bmad-output/implementation-artifacts/2-1-client-list-search.md`, `_bmad-output/implementation-artifacts/2-2-client-detail-view.md`]

### Test Scenarios from Test Design (Epic 2 — P0 + P1 for Story 2.3)

| TC ID | Priority | Level | Description |
|-------|----------|-------|-------------|
| TC-2.3-P0-01 | P0 | E2E | Happy path: fill all required fields, submit, assert client in list + toast "Cliente creado correctamente" (R-009) |
| TC-2.3-P0-02 | P0 | Component | Submit empty form, assert inline errors on Nombre, NIT/RUC, Teléfono, Ciudad; assert no API call fired (R-002) |
| TC-2.3-P0-03 | P0 | API | POST duplicate NIT → 409 with `title: "El NIT/RUC ya está registrado."`, no `stackTrace` field (R-002) |
| TC-2.3-P0-04 | P0 | Component | Mock 409 response, submit with duplicate NIT, assert "El NIT/RUC ya está registrado" on NIT field (R-002) |
| TC-2.3-P1-01 | P1 | Component | Submit valid form, mock 201 response, assert toast "Cliente creado correctamente" |
| TC-2.3-P1-02 | P1 | Component | Click "Cancelar", assert `onCancel` called and form not submitted |
| TC-2.3-P1-03 | P1 | Component | While `isPending`, assert submit button disabled and shows "Guardando…" |

### Non-Functional Requirements for This Story

- **NFR2 (CRUD < 2s):** TanStack Query `invalidateQueries` + re-fetch must complete and render the new client in the list within 2 seconds of the successful POST response.
- **NFR5 (Sanitization):** FluentValidation on all backend fields (server-side gate) + Zod on all frontend fields (client-side pre-submit guard). Both layers are mandatory.
- **NFR6 (No stack traces):** Backend must return Problem Details RFC 7807 for 409; frontend must not expose `error.message` or any Axios error internals. The NIT duplicate error shows only "El NIT/RUC ya está registrado" — no technical details.
- **FR27 (Immediate reflection):** New client must appear in `ClienteListView` immediately after creation without manual refresh. Achieved via `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in mutation `onSuccess`.
- **WCAG 2.1 AA:** All form inputs must have `<label>` with `htmlFor`; error messages must use `aria-describedby`; submit button must have accessible label; touch targets ≥ 44×44px.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (2026-06-21)

### Debug Log References

- Pre-existing test failure TC-2.1-C-06 in `ClienteListView.test.tsx` confirmed unrelated to this story (verified via git stash).
- `@testing-library/user-event` was not installed in the epic-2 worktree; installed as dev dependency.
- `sonner` toast library installed (no toast provider existed in the project). `<Toaster>` mounted in `__root.tsx`.
- `ClienteEntity.Create()` factory already present from a previous story — no changes needed to `ClienteEntity.cs`.
- Backend .NET tests authored by code inspection only — dotnet SDK not available in this environment.
- `IClienteRepository` interface updated with `AddAsync`; all existing `FakeClienteRepository` implementations in tests updated accordingly.

### Completion Notes List

- Toast library: `sonner` v2.0.7 added to frontend; `<Toaster richColors position="top-right" />` mounted in `__root.tsx`.
- siesa-ui-kit has no dialog equivalent — used existing shadcn Dialog (already installed from Story 1.1).
- Backend duplicate NIT detection: catches `DbUpdateException` filtering on `uk_clientes_nit` index name.
- All 5 `ClienteForm` component tests pass (TC-2.3-C-01 through TC-2.3-C-05).
- Frontend tests: 99 passed, 1 pre-existing failure (TC-2.1-C-06 — not Story 2.3 scope).
- Backend tests authored and code-reviewed; cannot be executed (dotnet SDK unavailable).

### File List

**New files:**
- `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
- `frontend/src/modules/crm/clientes/application/__tests__/clienteSchema.test.ts`
- `frontend/src/modules/crm/clientes/application/__tests__/useCreateCliente.test.ts`
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx`

**Modified files:**
- `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs` — added `AddAsync`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implemented `AddAsync`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — registered POST endpoint
- `backend/src/SiesaAgents.API/Program.cs` — registered `CreateClienteCommandHandler` + `CreateClienteRequestValidator`
- `backend/tests/SiesaAgents.UnitTests/Integration/ClienteEndpointsTests.cs` — added POST tests
- `backend/tests/SiesaAgents.UnitTests/Application/GetClientesQueryHandlerTests.cs` — added `AddAsync` to FakeClienteRepository
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` — added `AddAsync` to FakeClienteRepository
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — added `create` method
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implemented `create`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — added "Nuevo cliente" button + Dialog
- `frontend/src/routes/__root.tsx` — added `<Toaster>` from sonner
- `frontend/package.json` — added `sonner`, `@testing-library/user-event`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `2-3-create-client: in-progress`
