# Story 2.3: Create Client

Status: ready-for-dev

## Story

As a commercial team member,
I want to register a new client by filling in a form,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a form opens with fields: Nombre, NIT/RUC, Teléfono, Ciudad (all required per FR1).

2. **Given** the user fills all required fields and submits, **When** the form is submitted, **Then** the client is created and appears in the client list immediately (FR27), **And** a success toast shows "Cliente creado correctamente".

3. **Given** the user submits the form with one or more required fields empty, **When** the form is validated, **Then** clear inline error messages appear on the empty fields (FR8), **And** the form is NOT submitted to the backend.

4. **Given** the user submits a NIT/RUC that already exists in the system, **When** the backend returns a 409 conflict, **Then** an error message indicates "El NIT/RUC ya está registrado" without exposing technical details (NFR6).

## Tasks / Subtasks

- [ ] Task 1 — Add `useCreateCliente` mutation hook in application layer (AC: #2, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
  - [ ] Use `useMutation` with `mutationFn: (data: CreateClienteRequest) => clienteApiRepository.create(data)`
  - [ ] `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` + `toast.success('Cliente creado correctamente')`
  - [ ] `onError`: inspect `AxiosError.response.status`; if 409 → `toast.error('El NIT/RUC ya está registrado')`; otherwise → `toast.error('No se pudo guardar. Intenta de nuevo.')`
  - [ ] Return `{ mutate, isPending, isError }` from the hook

- [ ] Task 2 — Define `CreateClienteRequest` type in domain layer (AC: #1)
  - [ ] Add `frontend/src/modules/crm/clientes/domain/types.ts` (or extend existing) with:
    ```ts
    export interface CreateClienteRequest {
      nombre: string;
      nit: string;
      telefono: string;
      ciudad: string;
    }
    ```
  - [ ] If `types.ts` already exists, add the interface there; do NOT recreate the file

- [ ] Task 3 — Add `create(data)` method to `IClienteRepository` and `clienteApiRepository` (AC: #2)
  - [ ] Extend `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` with `create(data: CreateClienteRequest): Promise<Cliente>`
  - [ ] Implement in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: POST to `GET /api/v1/clientes` via shared `apiClient`
  - [ ] Note: `POST /api/v1/clientes` was added in Story 2.2 dev notes (ATDD setup). Confirm endpoint already exists before adding — if it does, skip backend creation task; if not, see Task 7.

- [ ] Task 4 — Implement Zod validation schema for client form (AC: #1, #3)
  - [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
  - [ ] Define `createClienteSchema` with `z.object({ nombre: z.string().min(1, 'Nombre requerido'), nit: z.string().min(1, 'NIT/RUC requerido'), telefono: z.string().min(1, 'Teléfono requerido'), ciudad: z.string().min(1, 'Ciudad requerida') })`
  - [ ] Export `CreateClienteFormData = z.infer<typeof createClienteSchema>`
  - [ ] If the file already exists (created in Story 2.2 ATDD), extend it rather than overwrite

- [ ] Task 5 — Create `ClienteForm` presentation component (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
  - [ ] Use React Hook Form + `zodResolver(createClienteSchema)`
  - [ ] Fields: Nombre (text), NIT/RUC (text), Teléfono (text), Ciudad (text) — all marked required
  - [ ] All field labels and placeholders in Spanish
  - [ ] Inline error messages beneath each field on blur or submit attempt (use `formState.errors`)
  - [ ] "Guardar" submit button — disabled and shows loading state while `isPending === true`
  - [ ] "Cancelar" button calls `onClose()` prop without submitting
  - [ ] On valid submit: call `mutate(formData)` from `useCreateCliente`; close form only in `onSuccess` (not immediately)
  - [ ] Props: `{ onClose: () => void; onSuccess?: () => void }`
  - [ ] Add `data-testid="cliente-form"` to the form element
  - [ ] Add `data-testid="cliente-form-submit"` to the submit button
  - [ ] WCAG 2.1 AA: each input has explicit `<label>` with `htmlFor` matching input `id`

- [ ] Task 6 — Integrate "Nuevo cliente" button and form into `ClienteListView` (AC: #1, #2)
  - [ ] Modify `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [ ] Add a "Nuevo cliente" button at the top of the left panel (above the search input)
  - [ ] Button click → sets local `isFormOpen: boolean` state to `true`
  - [ ] When `isFormOpen === true`: render `ClienteForm` (as a slide-over panel or inline modal — see UI notes below)
  - [ ] Pass `onClose={() => setIsFormOpen(false)}` and `onSuccess={() => setIsFormOpen(false)}` to `ClienteForm`
  - [ ] Button style: primary action button using Siesa Blue `#0e79fd`, icon `PlusIcon` from `@heroicons/react/24/outline`

- [ ] Task 7 — Backend: Validate `POST /api/v1/clientes` endpoint with FluentValidation (AC: #2, #3, #4)
  - [ ] Check if `CreateClienteCommand` and handler already exist (from Story 2.2 ATDD notes — they do per Story 2.2 completion notes)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteCommandValidator.cs`:
    ```csharp
    public class CreateClienteCommandValidator : AbstractValidator<CreateClienteCommand>
    {
        public CreateClienteCommandValidator()
        {
            RuleFor(x => x.Nombre).NotEmpty().WithMessage("Nombre es requerido.");
            RuleFor(x => x.Nit).NotEmpty().WithMessage("NIT/RUC es requerido.");
            RuleFor(x => x.Telefono).NotEmpty().WithMessage("Teléfono es requerido.");
            RuleFor(x => x.Ciudad).NotEmpty().WithMessage("Ciudad es requerida.");
        }
    }
    ```
  - [ ] Register validator in `Program.cs`: `builder.Services.AddScoped<IValidator<CreateClienteCommand>, CreateClienteCommandValidator>()`
  - [ ] In `CreateClienteCommandHandler.Handle()`: call `await _validator.ValidateAndThrowAsync(command, ct)` before persisting
  - [ ] Ensure `ExceptionHandlingMiddleware` maps `ValidationException` → `400 Bad Request` Problem Details
  - [ ] This resolves `[AI-Review][CRITICAL]` from Story 2.2 review

- [ ] Task 8 — Backend: Handle NIT duplicate — 409 Conflict response (AC: #4)
  - [ ] In `CreateClienteCommandHandler.Handle()` (or in `ClienteRepository.CreateAsync()`): catch the PostgreSQL unique constraint violation on `uk_clientes_nit`
  - [ ] Throw a domain exception (e.g., `DuplicateNitException` or use `ConflictException`) when NIT already exists
  - [ ] In `ExceptionHandlingMiddleware`: map this exception type → `409 Conflict` Problem Details with `detail: "El NIT/RUC ya está registrado"`
  - [ ] Alternatively: check existence via `_repository.ExistsByNitAsync(nit)` before insert, then throw if found
  - [ ] Endpoint must declare `.ProducesProblem(409)` in `ClienteEndpoints.cs`

- [ ] Task 9 — Tests: Frontend unit tests for `useCreateCliente` and `ClienteForm` (AC: #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`
    - [ ] Test: successful mutation → `invalidateQueries(['clientes'])` called + success toast shown
    - [ ] Test: 409 error → `'El NIT/RUC ya está registrado'` toast shown (not generic error)
    - [ ] Test: other error → generic error toast shown
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`
    - [ ] Test: all 4 fields render with correct labels in Spanish
    - [ ] Test: submitting empty form shows inline errors for all 4 fields; no mutation called
    - [ ] Test: submitting valid form calls `mutate` with correct payload
    - [ ] Test: "Cancelar" button calls `onClose` without submitting
    - [ ] Use `vi.mock('../application/useCreateCliente')` in component tests
  - [ ] Run: `pnpm --filter frontend test` — all new tests must pass

- [ ] Task 10 — Tests: Backend unit tests for `CreateClienteCommandHandler` and validator (AC: #2, #3, #4)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`
    - [ ] Test: valid input → creates entity, returns `ClienteDto` with correct fields
    - [ ] Test: empty `Nombre` → `ValidationException` thrown (FluentValidation)
    - [ ] Test: empty `Nit` → `ValidationException` thrown
    - [ ] Test: duplicate NIT → appropriate exception thrown → mapped to 409
  - [ ] Run: `dotnet test tests/SiesaAgents.UnitTests` (from `backend/` directory using `SiesaAgents.slnx`)

## Dev Notes

### Architecture Context

**Clean Architecture layer responsibilities (this story):**
- `domain/`: Extend `IClienteRepository` with `create(data)`. Add `CreateClienteRequest` interface (if not present).
- `application/`: New `useCreateCliente.ts` mutation hook. New `clienteSchema.ts` Zod schema.
- `infrastructure/`: Extend `clienteApiRepository.ts` with `create(data)` method calling `POST /api/v1/clientes`.
- `presentation/`: New `ClienteForm.tsx`. Modify `ClienteListView.tsx` to add "Nuevo cliente" button and form toggling.
- Backend `Application/Clientes/Validators/`: New `CreateClienteCommandValidator.cs`.

**Existing files that must be checked before creating (Story 2.2 added these):**
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs` — confirmed exists (Story 2.2 ATDD notes)
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs` — confirmed exists
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — already has `POST /api/v1/clientes` (Story 2.2 completion notes)
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts` — may or may not exist; check before creating
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — exists; extend with `create`

### Critical: Story 2.2 Review Follow-ups This Story Must Resolve

Story 2.2 code review flagged:
> [AI-Review][CRITICAL] `POST /api/v1/clientes` endpoint has NO FluentValidation. Create `CreateClienteCommandValidator.cs`... call `await validator.ValidateAndThrowAsync(command, ct)` inside handler.

**Task 7 directly resolves this CRITICAL review item.** The validator must be in place before the form can correctly rely on backend validation for empty-field protection.

### UI Implementation Requirements

**Form presentation pattern:**
- The architecture document and Story 2.2 do NOT specify whether the form opens as a modal, dialog, or slide-over. Based on the UX spec split-panel layout (280px left panel + flex right panel), the recommended approach is:
  - **Option A (preferred)**: Render `ClienteForm` as a `shadcn/ui Dialog` (already installed per architecture.md: `npx shadcn@latest add dialog`). The "Nuevo cliente" button opens the dialog; the form renders inside it.
  - **Option B (alternative)**: Render inline in the left panel, pushing the list down — only if the panel has enough vertical space.
- Check `siesa-ui-kit` catalog first for a modal/dialog equivalent before using shadcn Dialog.
- Install: `siesa-ui-kit` is already a dependency (`npm install siesa-ui-kit` in architecture.md setup).

**Button style (mandatory):**
- "Nuevo cliente": primary action using Siesa Blue (`bg-[#0e79fd] text-white hover:bg-[#154ca9]`) with `PlusIcon` (`@heroicons/react/24/outline` — already installed per Story 2.2 notes)
- "Guardar": same primary style; add `disabled:opacity-50 cursor-not-allowed` when `isPending`
- "Cancelar": secondary/ghost style (`text-slate-600 hover:bg-slate-100`)

**Form field layout:**
- Single column (`formColumns={1}` equivalent) — 4 text fields stacked vertically for clarity
- Each field: `<label>` (Spanish) + `<input>` + `<p className="text-xs text-red-500">` for inline error
- Input focus ring: `focus:ring-2 focus:ring-[#0e79fd]`

**MasterCrud consideration:**
- This story involves a CREATE form but NOT a full CRUD grid/list — the existing client list is a custom `ClienteListView` (280px panel), not a MasterCrud grid. Do NOT replace `ClienteListView` with MasterCrud for this story.
- MasterCrud would be appropriate if this story were building the entire CRUD management screen from scratch. Since the list is already implemented, use `ClienteForm` standalone component wired to `useCreateCliente`.

### Backend: `POST /api/v1/clientes` Contract

Per architecture.md:
```
POST /api/v1/clientes
  Request body: { "nombre": "string", "nit": "string", "telefono": "string", "ciudad": "string" }
  Response 201: ClienteDto (direct object, no wrapper)
  Response 400: Problem Details RFC 7807 (validation errors)
  Response 409: Problem Details RFC 7807 — detail: "El NIT/RUC ya está registrado"
  Response 500: Problem Details RFC 7807
```

**ClienteDto shape** (existing, returned on 201):
```json
{ "id": "uuid", "nombre": "...", "nit": "...", "telefono": "...", "ciudad": "...", "createdAt": "2026-03-12T10:30:00Z", "updatedAt": "..." }
```

**409 Conflict — duplicate NIT handling pattern:**
Two valid approaches:
1. Pre-check: `if (await _repository.ExistsByNitAsync(command.Nit, ct)) throw new ConflictException("El NIT/RUC ya está registrado");`
2. Catch DB exception: wrap `SaveChangesAsync()` in try/catch for `PostgresException` with code `23505` (unique violation) → rethrow as domain exception

Approach 1 is preferred for clarity and testability. ExceptionHandlingMiddleware must map this domain exception to `409`.

### State Management Decisions

- `useCreateCliente` — TanStack Query `useMutation`; on success invalidates `['clientes']` key
- Form open/close state: local `useState<boolean>` in `ClienteListView` — NOT Zustand (no cross-route persistence needed)
- After creation: the `invalidateQueries(['clientes'])` triggers automatic re-fetch; new client appears in list without manual update

### 409 Error Handling in Frontend

```typescript
onError: (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 409) {
    toast.error('El NIT/RUC ya está registrado');
  } else {
    toast.error('No se pudo guardar. Intenta de nuevo.');
  }
}
```

**Important:** NFR6 mandates no technical details exposed. The toast must show only "El NIT/RUC ya está registrado" — never the raw Problem Details `detail` field or `error.message`.

### Testing Standards Summary

**Frontend (Vitest + RTL + MSW):**
- Co-locate tests alongside source files
- `vi.mock('../application/useCreateCliente')` in `ClienteForm.test.tsx` to isolate from network
- MSW handlers for `POST /api/v1/clientes`: 201 (success), 400 (validation), 409 (duplicate NIT)
- Use `userEvent.type(...)` for input interaction; `userEvent.click(...)` for button clicks
- Coverage target: >80% for new files
- Run: `pnpm --filter frontend test`

**Backend (xUnit):**
- Manual fake repository (no Moq/NSubstitute — confirmed from Story 2.1 + 2.2)
- `CreateClienteCommandHandlerTests.cs` in `backend/tests/SiesaAgents.UnitTests/Application/Clientes/`
- Add `using Xunit;` explicitly (required — confirmed in Story 2.2)
- Solution file: `SiesaAgents.slnx` — run: `dotnet test tests/SiesaAgents.UnitTests`

### Previous Story Learnings (from Stories 2.1 and 2.2)

- Solution file: `SiesaAgents.slnx` (XML format, .NET 10) — NOT `SiesaAgents.sln`
- `using Xunit;` must be explicit in every test file
- No Moq/NSubstitute — use manual fake implementations for repositories
- `@heroicons/react` is installed (`/24/outline` and `/24/solid` variants available)
- `react-loading-skeleton` is installed (used in `ClienteListView`)
- `shadcn/ui Dialog` is installed (`npx shadcn@latest add dialog` was run at setup)
- Route tree (`routeTree.gen.ts`) is auto-regenerated by Vite plugin — no manual editing needed for this story (no new routes)
- `POST /api/v1/clientes` endpoint already exists (added in Story 2.2 for ATDD test infrastructure) — check before creating; if found, only add FluentValidation and 409 handling (Tasks 7, 8)
- `clienteDetailStore` (Zustand) was introduced in Story 2.2 — do NOT add form-open state to it; keep as local `useState`

### Git Commit Pattern

Follow existing convention: `feat(story-2.3):` prefix for commits in this story.

### Project Structure Notes

**New files to create:**
- `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts` (if not already created)
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`
- `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteCommandValidator.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`

**Files to modify:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `create(data: CreateClienteRequest): Promise<Cliente>`
- `frontend/src/modules/crm/clientes/domain/types.ts` (or `Cliente.ts`) — add `CreateClienteRequest` interface
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `create(data)` calling `POST /api/v1/clientes`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — add "Nuevo cliente" button + form toggle logic
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs` — add validator call
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — add `.ProducesProblem(409)` to POST endpoint
- `backend/src/SiesaAgents.API/Program.cs` — register `IValidator<CreateClienteCommand>` → `CreateClienteCommandValidator`

**Files confirmed existing (do NOT recreate):**
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (already has `POST /api/v1/clientes`)

### References

- FR1 (campos requeridos cliente), FR8 (validación), FR27 (cambios inmediatos): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- NFR2 (CRUD < 2s) — TanStack Query invalidation: [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- NFR6 (no stack traces) — Problem Details: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- POST /api/v1/clientes contract: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Story 2.2 CRITICAL review (FluentValidation missing): [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md#Review Follow-ups (AI)]
- Story 2.2 completion notes (CreateClienteCommand already exists): [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md#Completion Notes List]
- Mutation pattern (invalidateQueries + toast): [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- shadcn/ui Dialog already installed: [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation]
- MasterCrud reference — not applicable to standalone form: [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- Company standards (Clean Architecture, siesa-ui-kit priority, Spanish UI text): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
