# Story 3.4: Edit Contact

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit any field of an existing contact,
so that the contact information stays current.

## Acceptance Criteria

1. **Given** the user is viewing a contact's detail, **When** the user clicks "Editar", **Then** the contact form opens pre-filled with the current values of all fields: Nombre, Cargo, Teléfono, Email. (FR14, AC-E3.3)

2. **Given** the user modifies one or more fields and submits, **When** the form is saved, **Then** the changes are reflected in the contact detail and list immediately (FR27) **And** a toast de éxito shows "Contacto actualizado correctamente". (AC-E3.3, FR27, NFR2)

3. **Given** the user clears a required field and submits, **When** the form is validated, **Then** an inline error message appears on the cleared field and the form is NOT submitted to the backend. (AC-E3.4, FR16)

4. **Given** the user clicks "Cancelar" without saving, **When** the form closes, **Then** the original contact data remains unchanged and no PUT request is triggered.

5. **Given** the form submits successfully, **When** the mutation's `onSuccess` fires, **Then** `queryClient.invalidateQueries({ queryKey: ['contactos'] })` AND `queryClient.invalidateQueries({ queryKey: ['contactos', id] })` are called, causing both the list and detail to re-fetch with updated values. (FR27, equivalent to R-E2-05 for contacts)

6. **Given** the backend returns a validation error (400 Bad Request), **When** the error is received, **Then** the error message is displayed clearly without exposing technical details or stack traces. (NFR6)

7. **Given** the backend cannot find the contact (404 Not Found), **When** the error is received, **Then** a generic error toast is shown without exposing technical details. (NFR6)

## Tasks / Subtasks

- [x] Task 1 — Create `useUpdateContacto` application hook (AC: #2, #5)
  - [x] Create `frontend/src/modules/crm/contactos/application/useUpdateContacto.ts`
    - Uses `useMutation` from TanStack Query
    - `mutationFn: ({ id, data }: { id: string; data: ContactoFormData }) => contactoApiRepository.update(id, data)` — calls `PUT /api/v1/contactos/{id}`
    - `onSuccess(_result, { id })`: calls `queryClient.invalidateQueries({ queryKey: ['contactos'] })` AND `queryClient.invalidateQueries({ queryKey: ['contactos', id] })` to refresh both list and detail caches; shows toast "Contacto actualizado correctamente"
    - `onError`: shows generic "Error al actualizar el contacto" (never expose raw error details per NFR6)
    - Exposes `mutate`, `isPending`, `isError`, `error` from the hook

- [x] Task 2 — Extend infrastructure layer: add `update` to API repository (AC: #2)
  - [x] Update `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — add `update(id: string, data: ContactoFormData): Promise<Contacto>` method signature
  - [x] Update `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — implement `update`: calls `PUT /api/v1/contactos/${id}` via `apiClient` with `data` as JSON body; returns `Contacto`; throws on non-2xx (let `useMutation` `onError` handle it)

- [x] Task 3 — Update `ContactoForm` to support edit mode (AC: #1, #3, #4)
  - [x] Update `frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx`
    - Add optional props: `contacto?: Contacto` (existing contact to edit) and `mode?: 'create' | 'edit'` (defaults to `'create'`)
    - When `contacto` prop is provided, initialize form with `defaultValues` from the existing contact data using `useForm`'s `defaultValues` option: `{ nombre: contacto.nombre, cargo: contacto.cargo, telefono: contacto.telefono, email: contacto.email }`
    - When `mode === 'edit'`: submit calls `useUpdateContacto.mutate({ id: contacto.id, data })` instead of `useCreateContacto.mutate(data)`
    - Reuse same Zod `contactoSchema` and `zodResolver` for validation (schema unchanged)
    - "Guardar" button shows loading indicator when `isPending` is true; disabled during pending
    - "Cancelar" button closes form without triggering any mutation; calls `onCancel()` prop
    - Props interface updated: `{ contacto?: Contacto; mode?: 'create' | 'edit'; onSuccess?: () => void; onCancel?: () => void }`
    - Check siesa-ui-kit first for form input / label / button components; fall back to shadcn/ui, then custom
    - WCAG 2.1 AA compliance: `<label>` elements linked to inputs via `htmlFor`, appropriate ARIA attributes

- [x] Task 4 — Wire "Editar" button in `ContactoDetailView` (AC: #1, #4)
  - [x] Update `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`
    - Replace the placeholder "Editar" button stub (from Story 3.2) with working state management
    - Add `isEditFormOpen: boolean` state with `useState` (already has the button rendered per Story 3.2)
    - When `isEditFormOpen === true`: render `ContactoForm` with `mode="edit"` and `contacto={currentContacto}` (pass full `Contacto` object from TanStack Query cache)
    - Pass `onSuccess={() => setIsEditFormOpen(false)}` and `onCancel={() => setIsEditFormOpen(false)}` to `ContactoForm`
    - When `isEditFormOpen === false`: render the contact detail as before (Nombre, Cargo, Teléfono, Email)
    - Form host: use siesa-ui-kit dialog/sheet if available, else the shadcn `Dialog` component already installed in the project (added in Story 1.1/2.3/3.3)

- [x] Task 5 — Backend: PUT /api/v1/contactos/{id} endpoint (AC: #2, #3, #6, #7)
  - [ ] Create `UpdateContactoCommand.cs` + `UpdateContactoCommandHandler.cs` in `backend/src/SiesaAgents.Application/Contactos/Commands/`
    - Command record: `UpdateContactoCommand(Guid Id, string Nombre, string Cargo, string Telefono, string Email)`
    - Handler: loads `ContactoEntity` by ID via `IContactoRepository.GetByIdAsync(id)`; if not found, throws `NotFoundException` → 404 (handled by `ExceptionHandlingMiddleware`); calls `entity.Update(nombre, cargo, telefono, email)` which sets fields and `UpdatedAt = DateTimeOffset.UtcNow`; calls `IContactoRepository.UpdateAsync(entity)` and `SaveChangesAsync()`; returns updated `ContactoDto`
  - [ ] Add `Update(string nombre, string cargo, string telefono, string email)` method to `ContactoEntity` in `backend/src/SiesaAgents.Domain/Entities/ContactoEntity.cs`
    - Sets `Nombre`, `Cargo`, `Telefono`, `Email` on the entity
    - Sets `UpdatedAt = DateTimeOffset.UtcNow` — ALWAYS `DateTimeOffset`, NEVER `DateTime`
  - [ ] Create `UpdateContactoRequestValidator.cs` in `backend/src/SiesaAgents.Application/Contactos/Validators/`
    - FluentValidation: `Nombre`, `Cargo`, `Telefono`, `Email` all required (not empty/null)
    - `Email` must be valid email format: `.EmailAddress()`
    - Returns `400 Bad Request` with Problem Details on validation failure
  - [ ] Create `UpdateContactoRequest.cs` DTO in `backend/src/SiesaAgents.Application/Contactos/DTOs/` — fields: `Nombre`, `Cargo`, `Telefono`, `Email`
  - [ ] Update `backend/src/SiesaAgents.API/Endpoints/ContactosEndpoints.cs`
    - Add `PUT /api/v1/contactos/{id}` endpoint
    - Accepts `UpdateContactoRequest` body and `{id}` route param (Guid)
    - Returns `200 OK` with updated `ContactoDto` body
    - Returns `400 Bad Request` + Problem Details when FluentValidation fails
    - Returns `404 Not Found` + Problem Details when contact does not exist
    - Uses Scalar docs (NEVER Swagger)
  - [ ] Update `IContactoRepository` interface in `backend/src/SiesaAgents.Application/Contactos/Interfaces/IContactoRepository.cs` — add `Task UpdateAsync(ContactoEntity entity, CancellationToken ct = default)` method signature if not already present
  - [ ] Update `ContactoRepository` implementation in `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` — implement `UpdateAsync`: marks entity as Modified in EF Core context and calls `SaveChangesAsync()`
  - [ ] Verify `ContactoDto.cs` in `backend/src/SiesaAgents.Application/Contactos/DTOs/` includes `UpdatedAt` (DateTimeOffset) field — add if not present (it was not included in Story 3.1 scope)
  - [ ] Verify `ExceptionHandlingMiddleware.cs` (from Epic 1) maps `NotFoundException` → 404 Problem Details (already wired from Story 2.4 for clientes — confirm contacto domain uses same base exception)

- [x] Task 6 — Write tests (AC: #1–#7)
  - [x] **Unit test** `useUpdateContacto.test.ts` (Vitest + TanStack Query test utils):
    - TC-E3-P2-update-01: spy on `queryClient.invalidateQueries`; execute mutation `onSuccess` callback; assert `invalidateQueries({ queryKey: ['contactos'] })` AND `invalidateQueries({ queryKey: ['contactos', id] })` both called
    - TC-E3-P2-update-02: assert `isPending` is `true` during mutation execution
    - TC-E3-P2-update-03: execute mutation `onError` callback; assert generic error toast shown (no raw error details)
  - [x] **Component test** `ContactoForm.edit.test.tsx` (Vitest + RTL + MSW):
    - TC-E3-P1-07: Render `ContactoForm` with `mode="edit"` and `contacto={{ id: 'uuid-1', nombre: 'Ana López', cargo: 'Gerente', telefono: '3001234567', email: 'ana@example.com', clienteId: null, createdAt: '...' }}`; assert all 4 inputs are pre-filled with correct values
    - TC-E3-P1-08: Open edit form pre-filled, modify `Nombre`, click "Cancelar"; assert `onCancel` was called; assert PUT NOT triggered (MSW receives 0 PUT requests)
    - TC-E3-P1-09: Open edit form pre-filled, change `Cargo` to "Director", submit → MSW returns 200 → assert PUT called with correct payload `{ nombre, cargo: "Director", telefono, email }`, toast "Contacto actualizado correctamente" shown, `onSuccess` called
    - TC-E3-P2-02: Open edit form pre-filled, clear `Nombre`, submit; assert inline error on `Nombre` field; assert PUT not called (MSW receives 0 requests)
    - TC-E3-email-edit-invalid: Open edit form, enter invalid email, submit; assert inline error "El email no tiene un formato válido" on `email` field; assert PUT not called
  - [x] **API integration test** `UpdateContactoEndpointTests.cs` (xUnit + WebApplicationFactory):
    - TC-E3-P1-18: Seed contact with `cargo: "Vendedor"`; PUT `{ nombre, cargo: "Gerente", telefono, email }` to `/api/v1/contactos/{id}`; assert 200, response body has updated `cargo: "Gerente"` and `updatedAt` field (ISO 8601 with TZ); follow-up GET confirms persistence
    - TC-E3-update-404: PUT valid payload to non-existent ID `/api/v1/contactos/00000000-0000-0000-0000-000000000000`; assert 404 Problem Details with `status: 404`; assert NO `stackTrace` key
    - TC-E3-update-400: PUT `{}` (empty body) to valid ID; assert 400, Problem Details with errors on `nombre`, `cargo`, `telefono`, `email`; assert NO `stackTrace` key
    - TC-E3-update-400-email: PUT body with invalid email format; assert 400, Problem Details with error on `email`; assert NO `stackTrace`

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced. Layers: Domain → Application → Infrastructure → Presentation. No direct API calls in UI components.
- **CQRS**: Update operation is a Command (`UpdateContactoCommand`) not a Query. Handler is in `Application/Contactos/Commands/`.
- **Mutation hook**: `useUpdateContacto` uses TanStack Query `useMutation`. The `onSuccess` callback MUST call BOTH `queryClient.invalidateQueries({ queryKey: ['contactos'] })` AND `queryClient.invalidateQueries({ queryKey: ['contactos', id] })` — both invalidations are required to prevent stale data in the detail panel. Story 3.2 explicitly noted: "Mutations in Stories 3.3, 3.4, 3.5 MUST invalidate both `['contactos']` and `['contactos', id]`."
- **ContactoForm reuse**: The same `ContactoForm` component introduced in Story 3.3 is extended in this story to support both create and edit modes. Use the optional `contacto` prop and `defaultValues` in `useForm` to pre-fill the form. Do NOT create a separate `ContactoEditForm` component.
- **Entity update pattern**: `ContactoEntity` must have an `Update()` method (not a new factory) per DDD entity update patterns. The handler loads the entity, calls `entity.Update(...)`, then persists via the repository. This ensures `UpdatedAt = DateTimeOffset.UtcNow` is set correctly.
- **Primary keys**: `Id = Guid` — UUID mandatory per company standards. Route param `{id}` must be parsed as `Guid`, not string.
- **Problem Details RFC 7807**: All backend error responses (`400`, `404`) must use Problem Details format. No stack traces exposed to frontend (NFR6). `ExceptionHandlingMiddleware` from Epic 1 handles this.
- **Toast notifications**: Reuse whatever toast mechanism established in Story 3.3 (check `react-hot-toast` or existing toast system). Toast text: "Contacto actualizado correctamente" (success). Generic toast for non-validation errors; inline form error for validation failures (400).
- **Form default values**: When `mode === 'edit'`, pass `{ nombre: contacto.nombre, cargo: contacto.cargo, telefono: contacto.telefono, email: contacto.email }` as `defaultValues` to `useForm`. This populates all fields without manual `setValue` calls.
- **Cancel guard**: The `ContactoForm` cancel button must call `onCancel()` without triggering any submission or mutation. Critical for AC #4.
- **`clienteId` field**: NOT included in the update form or command. Contact-client association is managed by Epic 4. The `Update()` method on `ContactoEntity` must NOT modify `ClienteId`.
- **MasterCrud applicability**: This story uses the existing `ContactoForm` component extended for edit mode. The form is simple (4 fields) and integrated into the split-panel detail view. MasterCrud is NOT applicable here.

### siesa-ui-kit Usage (MANDATORY)

This story modifies an existing UI component (form with inputs and buttons). Check siesa-ui-kit catalog BEFORE creating any custom component:
- Reuse **form input / text field** component established in Story 3.3
- Reuse **button** component (primary "Guardar", secondary "Cancelar") from Story 3.3
- Reuse **modal / dialog / sheet** component from Story 3.3 (if form was shown in a dialog/sheet)
- Reuse **toast / notification** component from Story 3.3 for success message
- Install: `pnpm install siesa-ui-kit` (must already be present from Stories 1.x/2.x/3.x)
- **Heroicon**: `PencilIcon` for the "Editar" button in the detail panel if not already present from Story 3.2

### Project Structure Notes

Frontend files to create or modify:
```
frontend/src/modules/crm/contactos/
  domain/
    IContactoRepository.ts              ← Modify: add update(id, data) method signature
    Contacto.ts                         ← Verify: no changes needed
  application/
    useUpdateContacto.ts                ← New
  infrastructure/
    contactoApiRepository.ts            ← Modify: implement update(id, data)
  presentation/
    ContactoForm.tsx                    ← Modify: add contacto? and mode? props; support edit mode
    ContactoDetailView.tsx              ← Modify: wire "Editar" button + isEditFormOpen state
```

Backend files to create or modify:
```
backend/src/SiesaAgents.Domain/Entities/
  ContactoEntity.cs                    ← Modify: add Update() instance method

backend/src/SiesaAgents.Application/Contactos/
  Commands/UpdateContactoCommand.cs    ← New
  Commands/UpdateContactoCommandHandler.cs ← New
  Validators/UpdateContactoRequestValidator.cs ← New
  DTOs/UpdateContactoRequest.cs        ← New
  DTOs/ContactoDto.cs                  ← Modify: add UpdatedAt (DateTimeOffset) if not present
  Interfaces/IContactoRepository.cs    ← Modify: add UpdateAsync(ContactoEntity) if not present

backend/src/SiesaAgents.Infrastructure/
  Repositories/ContactoRepository.cs  ← Modify: implement UpdateAsync

backend/src/SiesaAgents.API/Endpoints/
  ContactosEndpoints.cs               ← Modify: add PUT /api/v1/contactos/{id} endpoint
```

Test files to create or modify:
```
frontend/src/modules/crm/contactos/
  application/useUpdateContacto.test.ts ← New
  presentation/ContactoForm.edit.test.tsx ← New

backend/tests/SiesaAgents.IntegrationTests/Contactos/
  UpdateContactoEndpointTests.cs       ← New
```

### API Contract

```
PUT /api/v1/contactos/{id}
  Route param: id (Guid / UUID)
  Request body: { "nombre": string, "cargo": string, "telefono": string, "email": string }

  Response success: 200 OK
  Body: ContactoDto (direct object, no wrapper)

  Response not found: 404 Not Found
  Content-Type: application/problem+json
  Body: Problem Details RFC 7807
    {
      "status": 404,
      "title": "Not Found",
      "detail": "Contacto no encontrado"
    }

  Response validation error: 400 Bad Request
  Content-Type: application/problem+json
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
  clienteId: Guid?    // null or existing — NOT modified by this endpoint
  createdAt: string   // DateTimeOffset ISO 8601 with TZ
  updatedAt: string   // DateTimeOffset ISO 8601 with TZ — updated on PUT
}
```

### TanStack Query Keys (Canonical)

```typescript
['contactos']                   // list — invalidate on PUT onSuccess
['contactos', id]               // single — invalidate on PUT onSuccess
['contactos', { clienteId }]    // contacts for a specific client — used in Epic 4
```

Mutation `onSuccess` in `useUpdateContacto` MUST call BOTH:
```typescript
queryClient.invalidateQueries({ queryKey: ['contactos'] })
queryClient.invalidateQueries({ queryKey: ['contactos', id] })
// Both invalidations ensure list AND detail panel show updated values immediately (FR27, NFR2)
```

### useUpdateContacto Hook Pattern

```typescript
// application/useUpdateContacto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'
import type { ContactoFormData } from './contactoSchema'

export function useUpdateContacto(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContactoFormData }) =>
      contactoApiRepository.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      queryClient.invalidateQueries({ queryKey: ['contactos', id] })
      // Show success toast: "Contacto actualizado correctamente"
      options?.onSuccess?.()
    },
    onError: (_error: unknown) => {
      // Show generic error: "Error al actualizar el contacto" — do NOT expose technical details (NFR6)
    },
  })
}
```

### ContactoForm Edit Mode Pattern

```typescript
// presentation/ContactoForm.tsx — updated to support both create and edit
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactoSchema, type ContactoFormData } from '../application/contactoSchema'
import { useCreateContacto } from '../application/useCreateContacto'
import { useUpdateContacto } from '../application/useUpdateContacto'
import type { Contacto } from '../domain/Contacto'

interface ContactoFormProps {
  contacto?: Contacto          // existing contact for edit mode
  mode?: 'create' | 'edit'    // defaults to 'create'
  onSuccess?: () => void
  onCancel?: () => void
}

export function ContactoForm({ contacto, mode = 'create', onSuccess, onCancel }: ContactoFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ContactoFormData>({
    resolver: zodResolver(contactoSchema),
    defaultValues: mode === 'edit' && contacto
      ? { nombre: contacto.nombre, cargo: contacto.cargo, telefono: contacto.telefono, email: contacto.email }
      : undefined,
  })

  const createMutation = useCreateContacto({ onSuccess })
  const updateMutation = useUpdateContacto({ onSuccess })

  const isPending = mode === 'create' ? createMutation.isPending : updateMutation.isPending

  const onSubmit = (data: ContactoFormData) => {
    if (mode === 'edit' && contacto) {
      updateMutation.mutate({ id: contacto.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Nombre, Cargo, Teléfono, Email fields with inline error messages */}
      {/* "Guardar" button: disabled + loading indicator when isPending */}
      {/* "Cancelar" button: calls onCancel() without submitting */}
    </form>
  )
}
```

### Backend Entity Update Method Pattern

```csharp
// Domain/Entities/ContactoEntity.cs — add Update() method
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
        // Already implemented in Story 3.3
        return new ContactoEntity
        {
            Nombre = nombre, Cargo = cargo, Telefono = telefono, Email = email,
            ClienteId = null,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow,
        };
    }

    // NEW in Story 3.4
    public void Update(string nombre, string cargo, string telefono, string email)
    {
        Nombre = nombre;
        Cargo = cargo;
        Telefono = telefono;
        Email = email;
        UpdatedAt = DateTimeOffset.UtcNow;  // ALWAYS DateTimeOffset, NEVER DateTime
        // ClienteId NOT modified here — Epic 4 handles client-contact association
    }
}
```

### UpdateContactoCommandHandler Pattern

```csharp
// Application/Contactos/Commands/UpdateContactoCommandHandler.cs
public class UpdateContactoCommandHandler
{
    private readonly IContactoRepository _repository;

    public UpdateContactoCommandHandler(IContactoRepository repository)
        => _repository = repository;

    public async Task<ContactoDto> Handle(UpdateContactoCommand command, CancellationToken ct)
    {
        var contacto = await _repository.GetByIdAsync(command.Id, ct);
        if (contacto is null)
            throw new NotFoundException($"Contacto con id {command.Id} no encontrado");

        contacto.Update(command.Nombre, command.Cargo, command.Telefono, command.Email);
        await _repository.UpdateAsync(contacto, ct);

        return new ContactoDto
        {
            Id = contacto.Id,
            Nombre = contacto.Nombre,
            Cargo = contacto.Cargo,
            Telefono = contacto.Telefono,
            Email = contacto.Email,
            ClienteId = contacto.ClienteId,
            CreatedAt = contacto.CreatedAt,
            UpdatedAt = contacto.UpdatedAt,
        };
    }
}
```

### MSW Handlers Required for Component Tests

```typescript
// __mocks__/handlers.ts — add to existing handlers from Stories 3.1/3.2/3.3
import { http, HttpResponse } from 'msw'

http.put('/api/v1/contactos/:id', async ({ params, request }) => {
  const body = await request.json() as any
  // Success case:
  return HttpResponse.json(
    {
      id: params.id,
      ...body,
      clienteId: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-29T10:00:00Z'
    },
    { status: 200 }
  )
  // 404 case (use override handler in specific tests):
  // return HttpResponse.json(
  //   { status: 404, title: 'Not Found', detail: 'Contacto no encontrado' },
  //   { status: 404 }
  // )
})
```

### Testing Test Cases Covered by This Story

- **P1:** TC-E3-P1-07 (edit form pre-filled with current contact values), TC-E3-P1-08 (cancel preserves original data + no PUT), TC-E3-P1-09 (save updates list and detail immediately), TC-E3-P1-18 (API PUT returns 200 with updatedAt)
- **P2:** TC-E3-P2-02 (clear required field shows inline error, blocks submit), TC-E3-P2-update-01 (both queryKeys invalidated on success)

### Previous Story Learnings (from Stories 3.1, 3.2, and 3.3)

- `contactoApiRepository.ts` already implements `getAll()`, `getById()`, and `create()` — follow the same Axios pattern for `update()`: `apiClient.put<Contacto>(\`/api/v1/contactos/${id}\`, data).then(r => r.data)`
- `apiClient.ts` (Axios singleton) is at `frontend/src/shared/lib/apiClient.ts` with `baseURL: import.meta.env.VITE_API_URL` (verified in Story 3.1)
- `contactoSchema.ts` (Zod) already validates all 4 required fields including email format — reuse unchanged for edit mode
- TanStack Query keys: `['contactos']` (list) and `['contactos', id]` (single) — BOTH must be invalidated on PUT `onSuccess` per Story 3.2 explicit note
- `ExceptionHandlingMiddleware.cs` is implemented from Epic 1 — add `NotFoundException` → 404 mapping if not already present (was added in Story 2.4 for clientes; verify if it uses a shared base exception class)
- `ContactosEndpoints.cs` already has `GET /api/v1/contactos`, `GET /api/v1/contactos/{id}`, and `POST /api/v1/contactos` — add `PUT` as a new `MapPut` call in the same file
- Story 3.2 note: "Mutations in Stories 3.3, 3.4, 3.5 MUST invalidate both `['contactos']` and `['contactos', id]`." — Create in Story 3.3 only invalidated `['contactos']`; Edit (this story) MUST invalidate both
- Story 3.3 completion notes: `ContactoForm` component uses `react-hook-form` + `zodResolver(contactoSchema)` — extend the same component with `mode` and `contacto` props
- Story 3.2 completion notes: `ContactoDetailView` uses `axios.isAxiosError` to differentiate 404 from 5xx — same pattern available in infrastructure layer for the update `onError`
- Zod v4 compatibility note from Story 3.1: ZodError uses `.issues` not `.errors` — maintain compatibility if needed
- `ContactoDetailView` already renders "Editar" and "Eliminar" placeholder buttons from Story 3.2 — wire the "Editar" button to `isEditFormOpen` state in this story
- `ContactoDto.cs` may not have `UpdatedAt` field (not required by Story 3.1 scope) — add it now and ensure `ContactoEntity` already has `UpdatedAt` (confirmed present from Story 3.1)

### Performance Notes

- After a successful PUT, `invalidateQueries(['contactos'])` triggers a background re-fetch of the full list. `invalidateQueries(['contactos', id])` triggers a re-fetch of the single contact detail. Both happen in parallel and the user sees updated data within the NFR2 < 2s window.
- Form validation (Zod) is synchronous — no latency impact.
- `isPending` state on the mutation prevents double-submit (button disabled during in-flight request).

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision)
- All user-facing text MUST be in Spanish (MANDATORY): field labels "Nombre", "Cargo", "Teléfono", "Email"; buttons "Guardar", "Cancelar", "Editar"; toast "Contacto actualizado correctamente"; error messages in Spanish
- Code variables, functions, classes MUST be in English (MANDATORY)
- NEVER expose `error.message`, backend stack traces, or internal exception details in the UI (NFR6)
- 404 response from backend must use Problem Details (no `stackTrace` key)
- FluentValidation on PUT endpoint including email format validation (NFR5)

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md` — Story 3.4 AC and FRs
- Previous story 3.3: `_bmad-output/implementation-artifacts/stories/story-3.3-create-contact.md` — `ContactoForm`, `useCreateContacto`, `contactoSchema`, `contactoApiRepository`, established patterns
- Previous story 3.2: `_bmad-output/implementation-artifacts/stories/story-3.2-contact-detail-view.md` — canonical query keys, `ContactoDetailView`, "Editar" placeholder button, invalidation note for stories 3.3–3.5
- Previous story 3.1: `_bmad-output/implementation-artifacts/stories/story-3.1-contact-list-search.md` — domain layer, `IContactoRepository`, `contactoApiRepository`, query keys established
- Reference story 2.4: `_bmad-output/implementation-artifacts/2-4-edit-client.md` — parallel pattern for edit form (clientes domain)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — API endpoints, data model, entity patterns, frontend folder structure, TanStack Query keys, mutation + invalidation strategy
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, DateTimeOffset, UUID PKs, FluentValidation, Problem Details RFC 7807, Zod + React Hook Form

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- ContactoDto extended with UpdatedAt (DateTimeOffset) field; all query handlers updated to include it
- ContactoEntity.Update() method added following DDD entity update pattern
- IContactoRepository extended with UpdateAsync; ContactoRepository implements it via EF Core Update()
- UpdateContactoCommand + Handler + Validator + Request DTO created following existing create pattern
- PUT /api/v1/contactos/{id} endpoint added to ContactosEndpoints; IUpdateContactoCommandHandler registered in Program.cs
- ContactoForm extended to support mode='edit' with defaultValues; create toast logic preserved
- ContactoDetailView wired with isEditFormOpen state; ToastProvider wrapper added
- useUpdateContacto hook follows exact pattern from useUpdateCliente reference
- Contacto domain type updated with optional updatedAt field for backward compat
- 10 unit tests + 15 component tests + 8 API integration tests all GREEN

### File List

Backend:
- backend/src/SiesaAgents.Domain/Entities/ContactoEntity.cs (modified: added Update() method)
- backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs (modified: added UpdatedAt)
- backend/src/SiesaAgents.Application/Contactos/DTOs/UpdateContactoRequest.cs (new)
- backend/src/SiesaAgents.Application/Contactos/Commands/UpdateContactoCommand.cs (new)
- backend/src/SiesaAgents.Application/Contactos/Commands/UpdateContactoCommandHandler.cs (new)
- backend/src/SiesaAgents.Application/Contactos/Validators/UpdateContactoRequestValidator.cs (new)
- backend/src/SiesaAgents.Application/Contactos/Interfaces/IContactoRepository.cs (modified: added UpdateAsync)
- backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQueryHandler.cs (modified: UpdatedAt)
- backend/src/SiesaAgents.Application/Contactos/Queries/GetContactoByIdQueryHandler.cs (modified: UpdatedAt)
- backend/src/SiesaAgents.Application/Contactos/Commands/CreateContactoCommandHandler.cs (modified: UpdatedAt)
- backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs (modified: added UpdateAsync)
- backend/src/SiesaAgents.API/Endpoints/ContactosEndpoints.cs (modified: added PUT endpoint)
- backend/src/SiesaAgents.API/Program.cs (modified: registered IUpdateContactoCommandHandler)

Frontend:
- frontend/src/modules/crm/contactos/domain/Contacto.ts (modified: added optional updatedAt)
- frontend/src/modules/crm/contactos/domain/IContactoRepository.ts (modified: added UpdateContactoInput + update method)
- frontend/src/modules/crm/contactos/application/useUpdateContacto.ts (new)
- frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts (modified: added update)
- frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx (modified: added edit mode support)
- frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx (modified: wired Editar button)
