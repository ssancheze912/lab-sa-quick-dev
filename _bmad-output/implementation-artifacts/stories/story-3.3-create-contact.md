# Story 3.3: Create Contact

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new contact by filling in a form,
so that the contact is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/contactos` view, **When** the user clicks "Nuevo contacto", **Then** a form opens with fields: Nombre, Cargo, Teléfono, Email — all required per FR9. (AC-E3.1, FR9)

2. **Given** the user fills all required fields and submits, **When** the form is submitted, **Then** the contact is created via `POST /api/v1/contactos`, the cache `['contactos']` is invalidated, the new contact appears in the contact list immediately (FR27), and a success toast shows "Contacto creado correctamente". (AC-E3.1, FR9, FR27, NFR2)

3. **Given** the user submits the form with one or more required fields empty, **When** the form is validated (client-side via Zod), **Then** clear inline error messages appear on each empty field and the form is NOT submitted to the backend. (AC-E3.4, FR16, NFR5)

4. **Given** the user submits a form with an invalid Email format, **When** the form is validated, **Then** an inline error message "El email no tiene un formato válido" is shown on the Email field and the form is NOT submitted to the backend. (AC-E3.4, FR16)

5. **Given** the backend returns a validation error (400 Bad Request), **When** the error is received, **Then** the error message is displayed clearly without exposing technical details or stack traces. (NFR6)

6. **Given** the form is open, **When** the user clicks "Cancelar" (or closes the form), **Then** the form closes without any mutation being triggered and the contact list remains unchanged.

7. **Given** the form submits successfully, **When** the mutation's `onSuccess` fires, **Then** `queryClient.invalidateQueries({ queryKey: ['contactos'] })` is called, causing the list to re-fetch and reflect the new contact. (FR27, equivalent to R-E2-05 for contacts)

## Tasks / Subtasks

- [ ] Task 1 — Verify Zod schema `contactoSchema` for form validation (AC: #3, #4)
  - [ ] Verify `frontend/src/modules/crm/contactos/application/contactoSchema.ts` (created in Story 3.1)
    - Schema must require: `nombre` (non-empty string), `cargo` (non-empty string), `telefono` (non-empty string), `email` (valid email format via `z.string().email()`)
    - Export `ContactoFormData` type inferred from the schema
    - This schema was created in Story 3.1 as a domain placeholder — confirm all 4 fields are present and validated; update if any field is missing or email format validation is absent

- [ ] Task 2 — Create `useCreateContacto` application hook (AC: #2, #7)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useCreateContacto.ts`
    - Uses `useMutation` from TanStack Query
    - `mutationFn: (data: ContactoFormData) => contactoApiRepository.create(data)` — calls `POST /api/v1/contactos`
    - `onSuccess`: calls `queryClient.invalidateQueries({ queryKey: ['contactos'] })` and shows toast "Contacto creado correctamente"
    - `onError(error)`: shows generic "Error al crear el contacto" (no stack traces or technical details exposed per NFR6)
    - Exposes `mutate`, `isPending`, `isError`, `error` from the hook

- [ ] Task 3 — Extend infrastructure layer: add `create` to API repository (AC: #2)
  - [ ] Update `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — add `create(data: ContactoFormData): Promise<Contacto>` method signature
  - [ ] Update `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — implement `create`: calls `POST /api/v1/contactos` via `apiClient` with `data` as JSON body; returns `Contacto`; throws on non-2xx (let `useMutation` `onError` handle it)

- [ ] Task 4 — Create `ContactoForm` presentation component (AC: #1, #3, #4, #5, #6)
  - [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx`
    - Uses `react-hook-form` with `zodResolver(contactoSchema)` for validation
    - Fields: Nombre, Cargo, Teléfono, Email — all `<input>` wrapped in labeled form controls; Email uses `type="email"`
    - Each field shows an inline error message from `formState.errors` below the input when validation fails
    - "Guardar" submit button — shows a loading indicator when `isPending` is true; disabled during pending
    - "Cancelar" button — calls `onCancel()` prop without triggering submit; closes form
    - `onSubmit` calls `useCreateContacto.mutate(data)`
    - Props interface: `{ onSuccess?: () => void; onCancel?: () => void }`
    - Check siesa-ui-kit first for form input / label / button components; fall back to shadcn/ui, then custom
    - WCAG 2.1 AA compliance: use `<label>` elements linked to inputs via `htmlFor`, appropriate ARIA attributes

- [ ] Task 5 — Wire "Nuevo contacto" button and form display in `ContactoListView` (AC: #1, #6)
  - [ ] Update `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`
    - Add "Nuevo contacto" button (Heroicon `PlusIcon` + label) in the list panel header
    - Manage `isFormOpen: boolean` state with `useState`
    - When `isFormOpen === true`: render `ContactoForm` inside the panel (inline or in a modal/sheet)
    - Pass `onSuccess={() => setIsFormOpen(false)}` and `onCancel={() => setIsFormOpen(false)}` to `ContactoForm`
    - When `isFormOpen === false`: render the contact list as before
  - [ ] Determine whether the form is shown inline or in a modal/dialog; use siesa-ui-kit dialog/sheet if available, else shadcn Dialog component (`npx shadcn@latest add dialog` — check if already added in Story 1.1/2.3)

- [ ] Task 6 — Backend: POST /api/v1/contactos endpoint (AC: #2, #3, #4, #5)
  - [ ] Create `CreateContactoCommand.cs` + `CreateContactoCommandHandler.cs` in `backend/src/SiesaAgents.Application/Contactos/Commands/`
    - Command record: `CreateContactoCommand(string Nombre, string Cargo, string Telefono, string Email)`
    - Handler: creates `ContactoEntity` via `ContactoEntity.Create(nombre, cargo, telefono, email)` factory; calls `IContactoRepository.AddAsync(entity)` and `SaveChangesAsync()`; returns `ContactoDto`
    - `ClienteId` defaults to `null` on creation (Epic 4 handles association)
  - [ ] Create `CreateContactoRequestValidator.cs` in `backend/src/SiesaAgents.Application/Contactos/Validators/`
    - FluentValidation: `Nombre`, `Cargo`, `Telefono`, `Email` all required (not empty/null)
    - `Email` must be a valid email format: `.EmailAddress()`
    - Validated before handler is called; returns `400 Bad Request` with Problem Details on validation failure
  - [ ] Update endpoint file `backend/src/SiesaAgents.API/Endpoints/ContactosEndpoints.cs`
    - Add `POST /api/v1/contactos` endpoint
    - Accepts `CreateContactoRequest` body (matches command fields: `nombre`, `cargo`, `telefono`, `email`)
    - Returns `201 Created` with `ContactoDto` body (include `Location` header pointing to `/api/v1/contactos/{id}`)
    - Returns `400 Bad Request` + Problem Details when FluentValidation fails (no `stackTrace` in response)
    - Uses Scalar docs (NEVER Swagger)
  - [ ] Ensure `ContactoEntity.Create()` factory is implemented in `backend/src/SiesaAgents.Domain/Entities/ContactoEntity.cs`:
    ```csharp
    public static ContactoEntity Create(string nombre, string cargo, string telefono, string email)
    {
        return new ContactoEntity
        {
            Nombre = nombre,
            Cargo = cargo,
            Telefono = telefono,
            Email = email,
            ClienteId = null,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }
    ```
  - [ ] Update `backend/src/SiesaAgents.Application/Contactos/Interfaces/IContactoRepository.cs` — add `Task AddAsync(ContactoEntity entity, CancellationToken ct = default)` method signature
  - [ ] Update `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` — implement `AddAsync`: uses EF Core `_context.Contactos.AddAsync(entity)` and `_context.SaveChangesAsync()`
  - [ ] Verify `ExceptionHandlingMiddleware.cs` (from Epic 1) correctly handles unexpected errors → 500 Problem Details without stack trace

- [ ] Task 7 — Write tests (AC: #1–#7)
  - [ ] **Unit test** `contactoSchema.test.ts` (extend Story 3.1 file if exists):
    - TC-E3-P0-05 (Part A): `contactoSchema.safeParse({})` → `{ success: false }`, errors on `nombre`, `cargo`, `telefono`, `email`
    - TC-E3-P2-07: `contactoSchema.safeParse({ nombre: "X" })` → errors on `cargo`, `telefono`, `email`; full valid object → `{ success: true }`
    - TC-E3-email-validation: `contactoSchema.safeParse({ nombre: "X", cargo: "Y", telefono: "123", email: "not-valid" })` → error on `email`
  - [ ] **Unit test** `useCreateContacto.test.ts`:
    - TC-E3-P2-05: spy on `queryClient.invalidateQueries`; execute mutation `onSuccess` callback; assert `invalidateQueries({ queryKey: ['contactos'] })` called
    - Assert `isPending` is `true` during mutation execution
  - [ ] **Component test** `ContactoForm.test.tsx` with MSW:
    - TC-E3-P0-04: Fill all 4 fields with valid data, submit → MSW returns 201 → assert POST called with correct payload, toast "Contacto creado correctamente" shown, `onSuccess` called
    - TC-E3-P0-05 (Part B): Leave all fields empty, submit → assert inline errors on each field; assert POST not called (MSW receives 0 requests)
    - TC-E3-email-invalid: Fill form with invalid email, submit → assert inline error "El email no tiene un formato válido" shown; POST not called
    - Cancel behavior: render form, click "Cancelar" → assert `onCancel` was called; POST not triggered
  - [ ] **API Integration test** `CreateContactoEndpointTests.cs` (xUnit + WebApplicationFactory):
    - TC-E3-P0-07: POST valid payload → assert 201, response has `id` (UUID), `nombre`, `cargo`, `telefono`, `email`, `clienteId` (null), `createdAt` (ISO 8601 with TZ); follow-up GET confirms record persisted
    - TC-E3-P1-19: POST `{}` (empty body) → assert 400, Problem Details with `errors` object containing `nombre`, `cargo`, `telefono`, `email`; no `stackTrace` key
    - TC-E3-email-400: POST with invalid email format → assert 400, Problem Details; no `stackTrace` key

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced. Layers: Domain → Application → Infrastructure → Presentation. No direct API calls in UI components.
- **CQRS**: Create operation is a Command (`CreateContactoCommand`) not a Query. Handler is in `Application/Contactos/Commands/`.
- **Mutation hook**: `useCreateContacto` uses TanStack Query `useMutation`. The `onSuccess` callback MUST call `queryClient.invalidateQueries({ queryKey: ['contactos'] })` to comply with FR27 (changes immediately visible) and NFR2 (< 2s update).
- **Note from Story 3.2 Dev Notes**: "Mutations in Stories 3.3, 3.4, 3.5 MUST invalidate both `['contactos']` and `['contactos', id]`." — For the create case, invalidate `['contactos']` only (no specific id yet); the list re-fetch picks up the new contact.
- **No duplicate-key constraint** for contacts (unlike clients with NIT uniqueness). Email is indexed but not unique per architecture. No 409 conflict handling required for this story.
- **Form validation**: React Hook Form + Zod. `zodResolver(contactoSchema)` wired to `useForm`. Zod schema (`contactoSchema.ts`) was introduced in Story 3.1; verify it has all 4 required fields with email format validation. Client-side validation runs on submit; inline errors per field.
- **Entity factory**: `ContactoEntity.Create()` static factory method is the single creation entry point per DDD entity pattern. Assigns `DateTimeOffset.UtcNow` to both `CreatedAt` and `UpdatedAt`. NEVER use `DateTime` — always `DateTimeOffset` (company standard).
- **Primary keys**: `Id = Guid.NewGuid()` (or `uuidv7()` via DB default if configured). UUID mandatory per company standards.
- **Problem Details RFC 7807**: All backend error responses (`400`, `404`) must use Problem Details format. No stack traces exposed to frontend (NFR6). `ExceptionHandlingMiddleware` from Epic 1 handles this.
- **Toast notifications**: Use whatever toast mechanism was established in previous stories (check if `react-hot-toast` or another library was installed). Toast on success only; error is shown inline in the form for validation failures.
- **`ClienteId` on creation**: Always `null` — contacts are created independently of client associations (FR25, orphan contacts). Epic 4 handles the client-contact link.
- **MasterCrud applicability**: This story uses a dedicated `ContactoForm` component embedded in the list layout, not a MasterCrud orchestrator. The form is simple (4 fields, no pagination, no grid) and follows the same split-panel pattern as `ClienteForm` in Story 2.3. MasterCrud is NOT applicable here.

### siesa-ui-kit Usage (MANDATORY)

This story has a UI component (form with inputs and buttons). Check siesa-ui-kit catalog BEFORE creating any custom component:
- Look for a **form input / text field** component in siesa-ui-kit
- Look for a **button** component (primary action "Guardar", secondary "Cancelar")
- Look for a **modal / dialog / sheet** component to host the form if not shown inline
- Look for a **toast / notification** component for the success message
- Install: `pnpm install siesa-ui-kit` (must already be present from Stories 1.x/2.x/3.x)
- If no siesa-ui-kit equivalent exists → fall back to shadcn/ui (Dialog was added in Story 1.1/2.3 setup) → custom

### Project Structure Notes

Frontend files to create or modify:
```
frontend/src/modules/crm/contactos/
  domain/
    IContactoRepository.ts              ← Modify: add create(data) method
    Contacto.ts                         ← Verify: no changes needed (Story 3.1)
  application/
    contactoSchema.ts                   ← Verify from Story 3.1 (all 4 fields + email format)
    useCreateContacto.ts                ← New
  infrastructure/
    contactoApiRepository.ts            ← Modify: implement create(data)
  presentation/
    ContactoForm.tsx                    ← New
    ContactoListView.tsx                ← Modify: add "Nuevo contacto" button + isFormOpen state
```

Backend files to create or modify:
```
backend/src/SiesaAgents.Domain/Entities/
  ContactoEntity.cs                    ← Verify/update: add Create() factory if not present

backend/src/SiesaAgents.Application/Contactos/
  Commands/CreateContactoCommand.cs    ← New
  Commands/CreateContactoCommandHandler.cs ← New
  Validators/CreateContactoRequestValidator.cs ← New
  DTOs/ContactoDto.cs                  ← Verify from Story 3.1 (should already exist)
  Interfaces/IContactoRepository.cs    ← Modify: add AddAsync(ContactoEntity) method

backend/src/SiesaAgents.Infrastructure/
  Repositories/ContactoRepository.cs  ← Modify: implement AddAsync

backend/src/SiesaAgents.API/Endpoints/
  ContactosEndpoints.cs               ← Modify: add POST /api/v1/contactos endpoint
```

Test files to create or modify:
```
frontend/src/modules/crm/contactos/
  application/contactoSchema.test.ts  ← Extend from Story 3.1 or create
  application/useCreateContacto.test.ts ← New
  presentation/ContactoForm.test.tsx  ← New

backend/tests/SiesaAgents.IntegrationTests/Contactos/
  CreateContactoEndpointTests.cs      ← New
```

### API Contract

```
POST /api/v1/contactos
  Request body: { "nombre": string, "cargo": string, "telefono": string, "email": string }

  Response success: 201 Created
  Headers: Location: /api/v1/contactos/{id}
  Body: ContactoDto (direct object, no wrapper)

  Response validation error: 400 Bad Request
  Body: Problem Details RFC 7807
    {
      "status": 400,
      "title": "Validation Error",
      "errors": { "nombre": ["..."], "cargo": ["..."], "telefono": ["..."], "email": ["..."] }
    }
    (NO stackTrace, NO innerException, NO exception keys)

ContactoDto {
  id: Guid            // UUID v4/v7
  nombre: string
  cargo: string
  telefono: string
  email: string
  clienteId: Guid?    // null on creation (Epic 4 handles association)
  createdAt: string   // DateTimeOffset ISO 8601 with TZ — e.g. "2026-06-29T10:00:00Z"
}
```

### TanStack Query Keys (Canonical)

```typescript
['contactos']                   // list — useContactos.ts (Story 3.1)
['contactos', id]               // single — useContacto.ts (Story 3.2)
['contactos', { clienteId }]    // contacts for a specific client — used in Epic 4
```

Mutation `onSuccess` in `useCreateContacto` MUST call:
```typescript
queryClient.invalidateQueries({ queryKey: ['contactos'] })
// This invalidates the list; re-fetch happens automatically per TanStack Query
```

### useCreateContacto Hook Pattern

```typescript
// application/useCreateContacto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'
import type { ContactoFormData } from './contactoSchema'

export function useCreateContacto(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ContactoFormData) => contactoApiRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      // Show success toast: "Contacto creado correctamente"
      options?.onSuccess?.()
    },
    onError: (_error: unknown) => {
      // Show generic error message — do NOT expose technical details (NFR6)
    },
  })
}
```

### ContactoForm Component Pattern

```typescript
// presentation/ContactoForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactoSchema, type ContactoFormData } from '../application/contactoSchema'
import { useCreateContacto } from '../application/useCreateContacto'

interface ContactoFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ContactoForm({ onSuccess, onCancel }: ContactoFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ContactoFormData>({
    resolver: zodResolver(contactoSchema),
  })

  const { mutate, isPending } = useCreateContacto({ onSuccess })

  const onSubmit = (data: ContactoFormData) => {
    mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Nombre, Cargo, Teléfono, Email fields with inline error messages */}
      {/* "Guardar" (disabled + loading when isPending) + "Cancelar" buttons */}
    </form>
  )
}
```

### Backend Entity Factory Pattern

```csharp
// Domain/Entities/ContactoEntity.cs
public class ContactoEntity : Entity  // Entity base provides Id (Guid)
{
    public string Nombre { get; private set; } = string.Empty;
    public string Cargo { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public Guid? ClienteId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private ContactoEntity() { }  // EF Core constructor

    public static ContactoEntity Create(string nombre, string cargo, string telefono, string email)
    {
        // FluentValidation handles empty checks before handler is called
        return new ContactoEntity
        {
            Nombre = nombre,
            Cargo = cargo,
            Telefono = telefono,
            Email = email,
            ClienteId = null,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }
}
```

### MSW Handlers Required for Component Tests

```typescript
// __mocks__/handlers.ts — add to existing handlers from Stories 3.1/3.2
import { http, HttpResponse } from 'msw'

http.post('/api/v1/contactos', async ({ request }) => {
  const body = await request.json() as any
  // Success case:
  return HttpResponse.json(
    { id: 'new-uuid', ...body, clienteId: null, createdAt: '2026-06-29T10:00:00Z' },
    { status: 201 }
  )
  // 400 case (use override handler in specific tests):
  // return HttpResponse.json(
  //   { status: 400, title: 'Validation Error', errors: { email: ['...'] } },
  //   { status: 400 }
  // )
})
```

### Testing Test Cases Covered by This Story

From epic-03 ACs and parallel with epic-02 test design patterns:
- **P0:** TC-E3-P0-04 (create → toast → list), TC-E3-P0-05 (validation blocks submit), TC-E3-P0-07 (API POST 201)
- **P1:** TC-E3-P1-19 (API POST empty → 400 Problem Details)
- **P2:** TC-E3-P2-05 (cache invalidation — `invalidateQueries`), TC-E3-P2-07 (Zod schema validates all 4 fields + email format)

### Previous Story Learnings (from Stories 3.1 and 3.2)

- `contactoApiRepository.ts` already implements `getAll()` and `getById()` — follow the same pattern for `create()`
- `apiClient.ts` (Axios singleton) is at `frontend/src/shared/lib/apiClient.ts` with `baseURL: import.meta.env.VITE_API_URL` (verified in Story 3.1)
- `EmptyState` and `ErrorPanel` are in `frontend/src/shared/components/` — reuse, do not recreate
- `react-loading-skeleton` is already installed; use for loading states
- TanStack Query `queryKey: ['contactos']` is the list key — invalidate it on all mutations
- `ExceptionHandlingMiddleware.cs` is implemented in Epic 1 — handles unexpected errors → 500 Problem Details
- `ContactosEndpoints.cs` already has `GET /api/v1/contactos` and `GET /api/v1/contactos/{id}` — add `POST` as a new `MapPost` call in the same file
- Story 3.1 note: "All mutations in later stories (3.3, 3.4, 3.5) MUST call `queryClient.invalidateQueries({ queryKey: ['contactos'] })`"
- Story 3.2 note: Mutations must also invalidate `['contactos', id]` — for create, no specific id exists yet, so invalidate `['contactos']` only
- Zod v4 compatibility note from Story 3.1: ZodError uses `.issues` not `.errors` — maintain compatibility wrapper in `contactoSchema.ts` if needed
- Story 3.2 completion notes: `ContactoDetailView` uses `axios.isAxiosError` to differentiate 404 from 5xx; same pattern available in infrastructure layer

### Performance Notes

- The contact list is loaded once into TanStack Query cache. After a successful `POST`, `invalidateQueries(['contactos'])` triggers a background re-fetch which includes the new contact. The user sees the updated list within the NFR2 < 2s window.
- Form validation (Zod) is synchronous and runs before any network call — no latency impact.
- `isPending` state on the mutation prevents double-submit (button disabled during in-flight request).

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision)
- All user-facing text MUST be in Spanish (MANDATORY): "Nombre", "Cargo", "Teléfono", "Email", "Guardar", "Cancelar", error messages
- Code variables, functions, classes MUST be in English (MANDATORY)
- NEVER expose `error.message`, backend stack traces, or internal exception details in the UI
- FluentValidation on the create endpoint (NFR5)
- `Email` validated as proper email format both client-side (Zod) and server-side (FluentValidation)

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md` — Story 3.3 AC and FRs
- Previous story 3.2: `_bmad-output/implementation-artifacts/stories/story-3.2-contact-detail-view.md` — canonical query keys, API contract shape, established patterns; invalidation note for stories 3.3–3.5
- Previous story 3.1: `_bmad-output/implementation-artifacts/stories/story-3.1-contact-list-search.md` — `contactoSchema`, `ContactoListView`, `IContactoRepository`, `contactoApiRepository`, `useContactos`
- Reference story 2.3: `_bmad-output/implementation-artifacts/2-3-create-client.md` — parallel pattern for create form (clients domain)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — API endpoints, data model, entity patterns, frontend folder structure, TanStack Query keys, mutation + invalidation strategy
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, DateTimeOffset, UUID PKs, FluentValidation, Problem Details RFC 7807, Zod + React Hook Form
- MasterCrud reference: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md` — MasterCrud is NOT applicable here. This story uses a dedicated `ContactoForm` component embedded in the list layout, not a MasterCrud orchestrator.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- frontend/src/modules/crm/contactos/domain/IContactoRepository.ts
- frontend/src/modules/crm/contactos/application/contactoSchema.ts
- frontend/src/modules/crm/contactos/application/useCreateContacto.ts
- frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts
- frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx
- frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx
- backend/src/SiesaAgents.Domain/Entities/ContactoEntity.cs
- backend/src/SiesaAgents.Application/Contactos/Commands/CreateContactoCommand.cs
- backend/src/SiesaAgents.Application/Contactos/Commands/CreateContactoCommandHandler.cs
- backend/src/SiesaAgents.Application/Contactos/Validators/CreateContactoRequestValidator.cs
- backend/src/SiesaAgents.Application/Contactos/Interfaces/IContactoRepository.cs
- backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs
- backend/src/SiesaAgents.API/Endpoints/ContactosEndpoints.cs
- frontend/src/modules/crm/contactos/application/contactoSchema.test.ts
- frontend/src/modules/crm/contactos/application/useCreateContacto.test.ts
- frontend/src/modules/crm/contactos/presentation/ContactoForm.test.tsx
- backend/tests/SiesaAgents.IntegrationTests/Contactos/CreateContactoEndpointTests.cs
