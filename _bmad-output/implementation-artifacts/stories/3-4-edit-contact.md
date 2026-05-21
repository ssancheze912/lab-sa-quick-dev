# Story 3.4: Edit Contact

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit any field of an existing contact,
so that the contact information stays current.

## Acceptance Criteria

1. **Given** the user is viewing a contact's detail, **When** the user clicks "Editar", **Then** the contact form dialog opens pre-filled with the current values of all four fields: Nombre, Cargo, Teléfono, Email (FR14).

2. **Given** the user modifies one or more fields and clicks "Guardar", **When** the form is submitted, **Then** the changes are persisted via `PUT /api/v1/contactos/:id`, the dialog closes, the updated values are reflected in the contact detail panel and list immediately without a page reload (FR27), and a toast displays "Contacto actualizado correctamente".

3. **Given** the user clears a required field and clicks "Guardar", **When** the Zod schema validation runs on submit, **Then** an inline error message appears under the empty field (FR16), the form does NOT send any request to the backend, and the dialog remains open.

4. **Given** the user clicks "Cancelar" without saving, **When** the dialog closes, **Then** the original contact data remains unchanged and no PUT request is fired.

## Tasks / Subtasks

- [ ] Task 1 — Frontend: create `useUpdateContacto` mutation hook (AC: 2, 3)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useUpdateContacto.ts`
  - [ ] Use `useMutation` with `mutationFn: ({ id, data }: { id: string; data: ContactoFormValues }) => contactoApiRepository.update(id, data)`
  - [ ] `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['contactos'] })`, then `toast.success('Contacto actualizado correctamente')`
  - [ ] `onError`: call `toast.error('No se pudo guardar. Intenta de nuevo.')`
  - [ ] Return mutation object including `isPending` and `error`
  - [ ] Add `update(id: string, data: UpdateContactoPayload): Promise<Contacto>` to `IContactoRepository` interface in `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`
  - [ ] Implement `update()` in `contactoApiRepository.ts` — `PUT /api/v1/contactos/:id`, return typed `Contacto`
  - [ ] Define `UpdateContactoPayload` as `Pick<Contacto, 'nombre' | 'cargo' | 'telefono' | 'email'>`

- [ ] Task 2 — Frontend: update `ContactoFormDialog` to support edit mode (AC: 1, 2, 3, 4)
  - [ ] Update `frontend/src/modules/crm/contactos/presentation/ContactoFormDialog.tsx`
  - [ ] Add optional props: `contacto?: Contacto` (when defined, dialog is in edit mode) and `contactoId?: string`
  - [ ] When `contacto` prop is provided, call `reset({ nombre: contacto.nombre, cargo: contacto.cargo, telefono: contacto.telefono, email: contacto.email })` inside a `useEffect` so all fields are pre-filled
  - [ ] When in edit mode, call `useUpdateContacto` hook; when in create mode, use `useCreateContacto` hook
  - [ ] On submit in edit mode: call `updateMutation.mutate({ id: contacto.id, data })` — on success close dialog via `onOpenChange(false)` and `reset()`
  - [ ] On cancel: call `onOpenChange(false)` and `reset()` without firing PUT — no pending mutation
  - [ ] Dialog title changes to "Editar contacto" in edit mode vs "Nuevo contacto" in create mode
  - [ ] "Guardar" button shows loading state while `isPending` is true (`disabled` + text "Guardando...")
  - [ ] `data-testid="contacto-form-dialog"` on `Dialog.Content` (already exists from Story 3.3)
  - [ ] `data-testid="input-nombre"` on Nombre input (already exists)
  - [ ] `data-testid="input-cargo"` on Cargo input (already exists)
  - [ ] `data-testid="input-telefono"` on Teléfono input (already exists)
  - [ ] `data-testid="input-email"` on Email input (already exists)
  - [ ] `data-testid="btn-guardar"` on submit button (already exists)
  - [ ] `data-testid="btn-cancelar"` on cancel button (already exists)
  - [ ] All labels, placeholders, and error messages in Spanish; WCAG 2.1 AA — inputs linked to labels via `htmlFor`/`id`; `aria-invalid`, `aria-describedby` on inputs when errors present

- [ ] Task 3 — Frontend: add "Editar" button to `ContactoDetailPanel` / `ContactoDetailView` (AC: 1)
  - [ ] Update `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx` (or its inner panel component)
  - [ ] Add an "Editar" button that opens `ContactoFormDialog` in edit mode, passing the current `contacto` as prop
  - [ ] Control dialog open state with `useState<boolean>`
  - [ ] `data-testid="btn-editar"` on the button
  - [ ] Siesa Blue `#0e79fd` as primary button color (`bg-[#0e79fd] text-white hover:bg-[#154ca9]`)

- [ ] Task 4 — Backend: create `UpdateContactoCommand` and handler (AC: 2, 3)
  - [ ] Create `backend/src/SiesaAgents.Application/Contactos/Commands/UpdateContactoCommand.cs` — record with `Guid Id`, `string Nombre`, `string Cargo`, `string Telefono`, `string Email`
  - [ ] Create `backend/src/SiesaAgents.Application/Contactos/Commands/UpdateContactoCommandHandler.cs` — validates via `UpdateContactoCommandValidator`, loads entity by Id (throws `KeyNotFoundException` if not found), updates fields via entity method, calls `IContactoRepository.UpdateAsync(entity, ct)`, maps to `ContactoDto` and returns it
  - [ ] Add `UpdateAsync(ContactoEntity entity, CancellationToken ct): Task<ContactoEntity>` to `IContactoRepository` interface in `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs`
  - [ ] Implement `UpdateAsync` in `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` — `_context.Contactos.Update(entity); await _context.SaveChangesAsync(ct); return entity;`
  - [ ] Register `UpdateContactoCommandHandler` in `Program.cs` DI

- [ ] Task 5 — Backend: create FluentValidation validator for update (AC: 3)
  - [ ] Create `backend/src/SiesaAgents.Application/Contactos/Validators/UpdateContactoCommandValidator.cs`
  - [ ] Rules: `Nombre` not empty, max 200; `Cargo` not empty, max 100; `Telefono` not empty, max 50; `Email` not empty, valid email format, max 200
  - [ ] Spanish error messages (e.g., `WithMessage("El nombre es requerido")`)
  - [ ] Register as `IValidator<UpdateContactoCommand>` (or concrete validator) in DI (`Program.cs`)

- [ ] Task 6 — Backend: expose `PUT /api/v1/contactos/{id}` endpoint (AC: 2, 3)
  - [ ] Add `PUT /{id:guid}` endpoint to `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`
  - [ ] Accept `UpdateContactoCommand` (or a binding DTO mapped to command) as request body with `{id}` from route
  - [ ] Returns `200 OK` with `ContactoDto` body on success
  - [ ] Returns `400 Bad Request` Problem Details (RFC 7807) on validation failure — no stack trace (NFR6)
  - [ ] Returns `404 Not Found` Problem Details (RFC 7807) when `id` does not exist — `ExceptionHandlingMiddleware` handles `KeyNotFoundException` → 404
  - [ ] `.Produces<ContactoDto>(StatusCodes.Status200OK)`, `.ProducesValidationProblem()`, and `.Produces(StatusCodes.Status404NotFound)` on the endpoint
  - [ ] `updatedAt` field in response uses `DateTimeOffset.UtcNow` (NEVER `DateTime`)

- [ ] Task 7 — Write E2E tests (AC: 1, 2, 3, 4)
  - [ ] Pre-created in ATDD phase: `e2e/tests/contactos/contactos-edit.spec.ts`
    - E2E-CT-18 (P0): Clicking "Editar" opens form pre-filled with current values of all 4 fields
    - E2E-CT-19 (P0): Modifying a field and saving updates detail panel and list row immediately (no reload)
    - E2E-CT-20 (P0): Clearing a required field and saving shows inline error; no PUT API call fired
    - E2E-CT-21 (P1): Success toast "Contacto actualizado correctamente" appears after successful edit
    - E2E-CT-22 (P1): Clicking "Cancelar" closes form without making PUT request; original data unchanged

- [ ] Task 8 — Write API integration tests (AC: 2, 3)
  - [ ] Add Story 3.4 describe block to `e2e/tests/contactos/contactos-api.spec.ts`
    - API-CT-05 (P0): `PUT /api/v1/contactos/:id` with valid changes returns 200 and updated fields in body
    - API-CT-10 (P1): `PUT /api/v1/contactos/:id` with missing required field returns 400 Problem Details (no `stackTrace` key)
    - API-CT-11 (P1): `PUT /api/v1/contactos/:id` with non-existent ID returns 404 Problem Details (no `stackTrace` key)

- [ ] Task 9 — Write backend unit tests (AC: 2, 3)
  - [ ] Add to `backend/tests/SiesaAgents.UnitTests/Handlers/ContactoHandlerTests.cs`
    - UNIT-B-CT-06 (P1): `UpdateContactoHandler` returns updated `ContactoDto` when contact exists
    - UNIT-B-CT-07 (P1): `UpdateContactoHandler` throws `KeyNotFoundException` (or equivalent) when contact ID does not exist
  - [ ] Add to `backend/tests/SiesaAgents.UnitTests/Validators/ContactoValidatorTests.cs`
    - UNIT-B-CT-08 (P1): `UpdateContactoCommandValidator`: empty Nombre fails with localized error message
    - UNIT-B-CT-09 (P1): `UpdateContactoCommandValidator`: valid payload passes validation

## Dev Notes

### Architecture Context

This story is the direct analog of Story 2.4 (Edit Client) applied to the contacts domain, and mirrors the same pattern.

**Depends on:**
- Story 3.1 — `Contacto` entity, `IContactoRepository`, `ContactoListView`, `useContactos` with `queryKey: ['contactos']` established
- Story 3.2 — `ContactoDetailView` (or `ContactoDetailPanel`) with `/contactos/$contactoId` route established
- Story 3.3 — `ContactoFormDialog`, `contactoSchema`, `ContactoFormValues`, `useCreateContacto`, `contactoApiRepository` all established. This story extends `ContactoFormDialog` to support edit mode via an optional `contacto` prop.

**Provides for:** Story 3.5 (Delete Contact) — `ContactoDetailView` with action buttons pattern established.

**Cache invalidation (R2 mitigation):** `useUpdateContacto` must call `queryClient.invalidateQueries({ queryKey: ['contactos'] })` on success. This invalidates BOTH the list cache `['contactos']` and potentially the single-contact cache `['contactos', id]`. If `ContactoDetailView` uses `useQuery({ queryKey: ['contactos', id] })`, also call `queryClient.invalidateQueries({ queryKey: ['contactos', contacto.id] })`.

**Cancel without PUT (R6 mitigation):** On cancel, call `reset()` to restore the form to prefilled values and call `onOpenChange(false)` WITHOUT calling the mutation. No network call should be fired.

### Frontend File Locations

```
frontend/src/
  modules/crm/contactos/
    domain/
      IContactoRepository.ts              # MODIFIED: add update(id: string, data: UpdateContactoPayload): Promise<Contacto>
    application/
      useUpdateContacto.ts                # NEW: useMutation hook
    infrastructure/
      contactoApiRepository.ts            # MODIFIED: implement update()
    presentation/
      ContactoFormDialog.tsx              # MODIFIED: add edit mode via contacto? prop
      ContactoDetailView.tsx              # MODIFIED: add "Editar" button + dialog state

e2e/tests/contactos/
  contactos-edit.spec.ts                 # NEW (or pre-created): E2E-CT-18 to E2E-CT-22
  contactos-api.spec.ts                  # MODIFIED: add API-CT-05, API-CT-10, API-CT-11 blocks
```

### Backend File Locations

```
backend/src/
  SiesaAgents.Application/Contactos/Commands/
    UpdateContactoCommand.cs               # NEW — command record
    UpdateContactoCommandHandler.cs        # NEW — handler with validator and KeyNotFoundException
  SiesaAgents.Application/Contactos/Validators/
    UpdateContactoCommandValidator.cs      # NEW — all 4 fields required
  SiesaAgents.API/Endpoints/
    ContactoEndpoints.cs                   # MODIFIED — add PUT /{id:guid} endpoint
  SiesaAgents.API/Program.cs              # MODIFIED — register UpdateContactoCommandHandler DI
  SiesaAgents.Domain/Contactos/Interfaces/
    IContactoRepository.cs                 # MODIFIED — add UpdateAsync
  SiesaAgents.Infrastructure/Repositories/
    ContactoRepository.cs                  # MODIFIED — implement UpdateAsync

backend/tests/
  SiesaAgents.UnitTests/Handlers/
    ContactoHandlerTests.cs                # MODIFIED — add UNIT-B-CT-06, UNIT-B-CT-07
  SiesaAgents.UnitTests/Validators/
    ContactoValidatorTests.cs              # MODIFIED — add UNIT-B-CT-08, UNIT-B-CT-09
```

### `useUpdateContacto` Hook Pattern

```typescript
// frontend/src/modules/crm/contactos/application/useUpdateContacto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'
import type { ContactoFormValues } from './contactoSchema'
import { useToastStore } from '../../../../shared/lib/toastStore'

export function useUpdateContacto() {
  const queryClient = useQueryClient()
  const toast = useToastStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContactoFormValues }) =>
      contactoApiRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      toast.success('Contacto actualizado correctamente')
    },
    onError: () => toast.error('No se pudo guardar. Intenta de nuevo.'),
  })
}
```

**Note:** Toast is implemented via the existing `toastStore.ts` Zustand store + `ToastContainer` (established in Story 2.3). Do NOT add sonner/react-toastify.

### `ContactoFormDialog` Edit Mode Pattern

```typescript
// frontend/src/modules/crm/contactos/presentation/ContactoFormDialog.tsx
interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacto?: Contacto   // when defined → edit mode
}

export function ContactoFormDialog({ open, onOpenChange, contacto }: Props) {
  const createMutation = useCreateContacto()
  const updateMutation = useUpdateContacto()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactoFormValues>({
    resolver: zodResolver(contactoSchema),
  })

  // Pre-fill form when editing
  useEffect(() => {
    if (contacto) {
      reset({ nombre: contacto.nombre, cargo: contacto.cargo, telefono: contacto.telefono, email: contacto.email })
    } else {
      reset({ nombre: '', cargo: '', telefono: '', email: '' })
    }
  }, [contacto, reset])

  const isPending = contacto ? updateMutation.isPending : createMutation.isPending

  const onSubmit = (data: ContactoFormValues) => {
    if (contacto) {
      updateMutation.mutate({ id: contacto.id, data }, {
        onSuccess: () => { reset(); onOpenChange(false) },
      })
    } else {
      createMutation.mutate(data, {
        onSuccess: () => { reset(); onOpenChange(false) },
      })
    }
  }

  const handleCancel = () => {
    reset()
    onOpenChange(false)
  }

  // ... rest of JSX with Dialog.Title: contacto ? 'Editar contacto' : 'Nuevo contacto'
}
```

### `contactoApiRepository.update()` Pattern

```typescript
// Addition to frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts
update: async (id: string, data: UpdateContactoPayload): Promise<Contacto> => {
  const response = await apiClient.put<Contacto>(`/api/v1/contactos/${id}`, data)
  return response.data
},
```

### Backend: `UpdateContactoCommand` and Handler Pattern

```csharp
// backend/src/SiesaAgents.Application/Contactos/Commands/UpdateContactoCommand.cs
namespace SiesaAgents.Application.Contactos.Commands;

public record UpdateContactoCommand(Guid Id, string Nombre, string Cargo, string Telefono, string Email);
```

```csharp
// backend/src/SiesaAgents.Application/Contactos/Commands/UpdateContactoCommandHandler.cs
using FluentValidation;
using SiesaAgents.Domain.Contactos.Interfaces;
using SiesaAgents.Application.Contactos.DTOs;

namespace SiesaAgents.Application.Contactos.Commands;

public class UpdateContactoCommandHandler(
    IContactoRepository repository,
    UpdateContactoCommandValidator validator)
{
    public async Task<ContactoDto> HandleAsync(UpdateContactoCommand command, CancellationToken ct)
    {
        var result = await validator.ValidateAsync(command, ct);
        if (!result.IsValid)
            throw new ValidationException(result.Errors);

        var entity = await repository.GetByIdAsync(command.Id, ct)
            ?? throw new KeyNotFoundException($"Contacto with id {command.Id} was not found.");

        entity.Update(command.Nombre, command.Cargo, command.Telefono, command.Email);
        var updated = await repository.UpdateAsync(entity, ct);

        return new ContactoDto(
            updated.Id,
            updated.Nombre,
            updated.Cargo,
            updated.Telefono,
            updated.Email,
            updated.ClienteId,
            updated.CreatedAt,
            updated.UpdatedAt
        );
    }
}
```

**Note:** `ContactoEntity` needs an `Update()` method if not already present:

```csharp
// Addition to backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs
public void Update(string nombre, string cargo, string telefono, string email)
{
    Nombre = nombre;
    Cargo = cargo;
    Telefono = telefono;
    Email = email;
    UpdatedAt = DateTimeOffset.UtcNow;
}
```

### Backend: `PUT /api/v1/contactos/{id}` Endpoint

```csharp
// Addition to backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs
group.MapPut("/{id:guid}", async (
    Guid id,
    UpdateContactoCommand body,
    UpdateContactoCommandHandler handler,
    CancellationToken ct) =>
{
    var command = body with { Id = id };
    var result = await handler.HandleAsync(command, ct);
    return Results.Ok(result);
})
.WithName("UpdateContacto")
.Produces<ContactoDto>(StatusCodes.Status200OK)
.ProducesValidationProblem()
.Produces(StatusCodes.Status404NotFound);
```

**Note:** `ExceptionHandlingMiddleware` already handles `ValidationException` → 400 Problem Details and must also handle `KeyNotFoundException` → 404 Problem Details. Verify this handler is registered (analogous to Story 2.4 pattern).

**Response contract (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "nombre": "María García Actualizada",
  "cargo": "Directora Comercial",
  "telefono": "+57 1 234 5680",
  "email": "m.garcia.new@empresa.com",
  "clienteId": null,
  "createdAt": "2026-05-21T10:30:00Z",
  "updatedAt": "2026-05-21T11:00:00Z"
}
```

**400 response (Problem Details — RFC 7807, no stackTrace):**

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Validation Error",
  "status": 400,
  "errors": {
    "Nombre": ["El nombre es requerido"]
  }
}
```

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` — check its catalog FIRST before creating any custom UI element
- **Install**: `npm install siesa-ui-kit` (ensure dependency is present in `frontend/package.json`)
- **Usage**: Use `siesa-ui-kit` components for all UI elements when an equivalent exists. Do NOT create custom components if the kit provides one.
- **Constraint**: Radix UI `Dialog` is used via the existing `ContactoFormDialog.tsx` pattern (established in Story 3.3 using `@radix-ui/react-dialog`). Reuse this component — do not install a new dialog library.
- **Buttons**: Siesa Blue `#0e79fd` (`bg-[#0e79fd] text-white hover:bg-[#154ca9]`) — consistent with Story 3.3 and 2.4 patterns.

### `data-testid` Attributes Required

| Attribute | Component | File | Status |
|---|---|---|---|
| `btn-editar` | `ContactoDetailView` | `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx` | NEW |
| `contacto-form-dialog` | `ContactoFormDialog` (Dialog.Content) | `frontend/src/modules/crm/contactos/presentation/ContactoFormDialog.tsx` | already exists (3.3) |
| `input-nombre` | `ContactoFormDialog` | same file | already exists (3.3) |
| `input-cargo` | `ContactoFormDialog` | same file | already exists (3.3) |
| `input-telefono` | `ContactoFormDialog` | same file | already exists (3.3) |
| `input-email` | `ContactoFormDialog` | same file | already exists (3.3) |
| `btn-guardar` | `ContactoFormDialog` | same file | already exists (3.3) |
| `btn-cancelar` | `ContactoFormDialog` | same file | already exists (3.3) |

### Testing Requirements

**E2E Tests (Playwright) — `e2e/tests/contactos/contactos-edit.spec.ts`:**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| E2E-CT-18 | P0 | AC1 | Clicking "Editar" opens form pre-filled with current values of all 4 fields |
| E2E-CT-19 | P0 | AC2 | Modifying a field and saving updates detail panel and list row immediately (no reload) |
| E2E-CT-20 | P0 | AC3 | Clearing a required field → inline error shown, no PUT fired |
| E2E-CT-21 | P1 | AC2 | Toast "Contacto actualizado correctamente" visible after successful edit |
| E2E-CT-22 | P1 | AC4 | Cancel: no PUT fired, original data preserved in detail panel |

**E2E implementation notes (from test-design-epic-3.md):**
- E2E-CT-18: After clicking Editar, assert `contactosPage.inputNombre.inputValue()` equals the contact's nombre; assert `contactosPage.inputEmail.inputValue()` equals the email.
- E2E-CT-19: Modify nombre to a unique value. After save, assert new nombre visible in `contactosPage.contactoRows` and `contactosPage.detailPanel`. No `page.reload()`.
- E2E-CT-20: Clear `inputNombre`, click guardar. Assert form visible, error message on Nombre. Use request interceptor to assert no PUT call fired.
- E2E-CT-22: `page.route('**/api/v1/contactos/**', ...)` + method check for PUT; open edit, modify field, click Cancelar. Assert original nombre still displayed.

**API Integration Tests — `e2e/tests/contactos/contactos-api.spec.ts` (Story 3.4 scope):**

| Test ID | Priority | Description |
|---------|----------|-------------|
| API-CT-05 | P0 | PUT valid payload → 200 + updated body with all fields and new `updatedAt` |
| API-CT-10 | P1 | PUT missing `nombre` → 400 Problem Details (no `stackTrace` key) |
| API-CT-11 | P1 | PUT non-existent ID → 404 Problem Details (no `stackTrace` key) |

**Backend Unit Tests (xUnit):**

| Test ID | Priority | File | Description |
|---------|----------|------|-------------|
| UNIT-B-CT-06 | P1 | `ContactoHandlerTests.cs` | `UpdateContactoHandler` returns updated `ContactoDto` when contact exists |
| UNIT-B-CT-07 | P1 | `ContactoHandlerTests.cs` | `UpdateContactoHandler` throws `KeyNotFoundException` when contact ID not found |
| UNIT-B-CT-08 | P1 | `ContactoValidatorTests.cs` | `UpdateContactoCommandValidator`: empty Nombre fails with localized error |
| UNIT-B-CT-09 | P1 | `ContactoValidatorTests.cs` | `UpdateContactoCommandValidator`: valid payload passes validation |

### Key Anti-Patterns to Avoid

```
❌ useEffect(() => reset(contacto), [contacto])      → always reset with explicit fields: reset({ nombre: ..., cargo: ..., telefono: ..., email: ... })
❌ firing PUT on cancel                              → only call mutation inside onSubmit, never in handleCancel
❌ no queryClient.invalidateQueries on success       → always invalidate ['contactos'] on successful update (FR27, R2)
❌ new form/dialog for edit                          → reuse existing ContactoFormDialog with optional contacto prop (DRY)
❌ exposing backend error.message to user            → generic "No se pudo guardar. Intenta de nuevo." (NFR6)
❌ spinner for loading state                         → "Guardando..." text on disabled submit button
❌ DateTime in UpdatedAt                             → DateTimeOffset mandatory (already enforced by entity Update())
❌ [Column("...")] attributes                        → ApplySnakeCaseNaming() handles mapping
❌ app.UseSwagger()                                  → Scalar already configured
❌ int/string PK                                     → Guid UUID
❌ missing KeyNotFoundException → 404 middleware     → verify ExceptionHandlingMiddleware covers it (Story 2.4 pattern)
❌ English UI text                                   → all labels, placeholders, errors in Spanish
```

### Project Structure Notes

- `ContactoFormDialog.tsx` was created in Story 3.3 with create-only logic. This story extends it to support edit mode via an optional `contacto` prop — identical pattern to Story 2.4 extending `ClienteFormDialog`.
- `contactoSchema.ts` Zod schema already exists — reuse as-is (same 4 required fields, valid for both create and update).
- `IContactoRepository` and `contactoApiRepository.ts` already have `create()` and `getById()` methods from Story 3.3. Add `update()` following the same pattern.
- `UpdateContactoCommand`, `UpdateContactoCommandHandler`, `UpdateContactoCommandValidator` follow the exact same CQRS structure as the clientes domain (`UpdateClienteCommand` / `UpdateClienteCommandHandler`).
- `ExceptionHandlingMiddleware` must handle `KeyNotFoundException` → 404 Problem Details. Verify this was added in Story 2.4 (it was listed as a requirement there). If not present, add it now.
- `toastStore.ts` and `ToastContainer.tsx` already exist from Story 2.3 — reuse without reinstalling any toast library.
- This story corresponds to test IDs E2E-CT-18 through E2E-CT-22 and API-CT-05 in the test design document (`_bmad-output/implementation-artifacts/test-design-epic-3.md`).

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md` — Story 3.4 AC
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "API & Communication Patterns" (PUT /api/v1/contactos/{id}), "Frontend Architecture" (queryKey invalidation), "Implementation Patterns & Consistency Rules"
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-3.md` — E2E-CT-18 to E2E-CT-22, API-CT-05, UNIT-B-CT-06 to UNIT-B-CT-09, risk R2 (cache invalidation), risk R6 (cancel fires PUT)
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-contactos.md` — FR14 (edit), FR16 (required field validation), FR27 (changes immediately visible)
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Frontend Stack, Backend Stack, Database Conventions, Backend Critical Rules
- Predecessor story 3.3: `_bmad-output/implementation-artifacts/stories/3-3-create-contact.md` — establishes ContactoFormDialog, contactoSchema, useCreateContacto, contactoApiRepository, all reused here
- Reference story 2.4: `_bmad-output/implementation-artifacts/stories/2-4-edit-client.md` — analogous edit pattern for clientes domain; exact mirror for architecture decisions and implementation patterns

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
