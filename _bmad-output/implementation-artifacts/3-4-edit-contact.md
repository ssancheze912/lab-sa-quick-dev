# Story 3.4: Edit Contact

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit any field of an existing contact,
so that the contact information stays current.

## Acceptance Criteria

1. **Given** the user is viewing a contact's detail, **When** the user clicks "Editar", **Then** the contact form opens pre-filled with the current values of all fields: Nombre, Cargo, Teléfono, Email (FR14).

2. **Given** the user modifies one or more fields and submits the form, **When** the form is saved, **Then** the changes are sent via `PUT /api/v1/contactos/:id`, the updated values are reflected immediately in the contact detail and the list without page reload (FR27), **And** a success toast displays "Contacto actualizado correctamente".

3. **Given** the user clears a required field and submits, **When** the form is validated (client-side Zod), **Then** an inline error message appears on the empty field and the form is NOT submitted to the backend (FR16).

4. **Given** the user clicks "Cancelar" without saving, **When** the form closes, **Then** the original contact data remains unchanged and no API call is made.

## Tasks / Subtasks

- [x] Task 1 — Backend: `PUT /api/v1/contactos/:id` endpoint with FluentValidation (AC: #2, #3)
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/DTOs/UpdateContactoRequest.cs` — record with `string Nombre, string Cargo, string Telefono, string Email`
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/Validators/UpdateContactoRequestValidator.cs` — FluentValidation: `RuleFor(x => x.Nombre).NotEmpty().MaximumLength(255)`; same for `Cargo` (MaxLength 255), `Telefono` (MaxLength 50), `Email` (MaxLength 255 + `.EmailAddress()`); all fields required
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/Commands/UpdateContactoCommand.cs` — record with `Guid Id, string Nombre, string Cargo, string Telefono, string Email`
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/Commands/UpdateContactoCommandHandler.cs` — calls `IContactoRepository.GetByIdAsync(command.Id, ct)`; if null → returns null (caller maps to 404); calls `entity.Update(...)` domain method; calls `IContactoRepository.UpdateAsync(entity, ct)`; returns updated `ContactoDto`
  - [x] Add `Update(string nombre, string cargo, string telefono, string email)` method to `ContactoEntity` in `backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs` — updates fields and sets `UpdatedAt = DateTimeOffset.UtcNow` (NEVER `DateTime`)
  - [x] Add `Task UpdateAsync(ContactoEntity entity, CancellationToken ct)` to `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs`
  - [x] Add `UpdateAsync` implementation to `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` — `_context.Contactos.Update(entity); await _context.SaveChangesAsync(ct);`
  - [x] Add `MapPut("/{id:guid}", ...)` to `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` — validates `UpdateContactoRequest` via `UpdateContactoRequestValidator`; on invalid → `Results.ValidationProblem(errors)` (400); on entity not found (null from handler) → `Results.Problem(detail: "El contacto solicitado no fue encontrado.", statusCode: 404, title: "Contacto no encontrado")`; on DB unique constraint violation (PostgreSQL error 23505 on `uk_contactos_email`) → `Results.Problem(detail: "El email ya está registrado", statusCode: 409, title: "Conflicto de datos")`; on success → `Results.Ok(dto)` (200)
  - [x] Register `UpdateContactoCommandHandler` and `UpdateContactoRequestValidator` in `backend/src/SiesaAgents.API/Program.cs` DI

- [x] Task 2 — Frontend: Application layer — `useUpdateContacto` mutation hook (AC: #2, #4)
  - [x] Create `frontend/src/modules/crm/contactos/application/useUpdateContacto.ts` — TanStack Query `useMutation`:
    - `mutationFn: ({ id, data }: { id: string; data: ContactoFormData }) => contactoApiRepository.update(id, data)`
    - `onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contactos'] }); toast.success('Contacto actualizado correctamente'); }` — FR27 immediate list update via cache invalidation (R-002 mitigation)
    - Export `useUpdateContacto` as named export
  - [x] Extend `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — add `update(id: string, data: ContactoFormData): Promise<Contacto>`
  - [x] Extend `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — add `update(id: string, data: ContactoFormData)` method: `PUT /api/v1/contactos/${id}` via `apiClient`; returns `response.data`

- [x] Task 3 — Frontend: Presentation layer — extend `ContactoForm` for edit mode (AC: #1, #2, #3, #4)
  - [x] Update `frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx` to support edit mode:
    - Add optional props: `contactoId?: string` (when provided, activates edit mode)
    - When `contactoId` and `defaultValues` are provided: use `useUpdateContacto` mutation and pre-fill all four fields via `useForm({ resolver: zodResolver(contactoSchema), defaultValues })`
    - When no `contactoId`: use `useCreateContacto` mutation (existing create behavior — do NOT break)
    - Submit button label: `"Guardar cambios"` in edit mode (`data-testid="btn-submit"`), `"Crear contacto"` in create mode — disabled while mutation `isPending`; shows `"Guardando..."` while pending in edit mode
    - On 409 from update mutation `onError`: set form error on `email` field via `setError('email', { message: 'El email ya está registrado' })` (NFR6 — no technical details)
    - On 400 from update mutation `onError` (non-409): displays generic error via `setError('root', ...)` without stack traces
    - On `onSuccess`: calls `onSuccess?.()` then `onClose()`
    - Cancel button `"Cancelar"` (`data-testid="btn-cancel"`) — calls `onClose` without mutation; original TanStack Query cache untouched (AC: #4, R-008)
    - All user-facing text in Spanish; no `any` TypeScript types
    - `data-testid="contacto-form"` on the `<form>` element

- [x] Task 4 — Frontend: "Editar" button wiring in `ContactoDetailView` (AC: #1)
  - [x] Update `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`:
    - Add `"Editar"` button (`data-testid="btn-editar"`) visible only in the data-loaded state (not during loading/error/not-found)
    - Clicking it sets local `useState<boolean>` `isEditFormOpen = true`
    - Render `<ContactoForm contactoId={contacto.id} defaultValues={{ nombre: contacto.nombre, cargo: contacto.cargo, telefono: contacto.telefono, email: contacto.email }} onClose={() => setIsEditFormOpen(false)} onSuccess={() => refetch()} />` conditionally when `isEditFormOpen === true` — displayed as accessible modal overlay (`role="dialog"`) consistent with Story 2.4 and Story 3.3 patterns

- [x] Task 5 — Tests (AC: #1, #2, #3, #4) — aligned with test-design-epic-3.md
  - [x] **Backend API — P1**: `PUT /api/v1/contactos/:id` with valid payload returns 200 + updated `ContactoDto` JSON (xUnit, WebApplicationFactory) — TC-E3-3-4-API-1
  - [x] **Backend API — P1**: `PUT /api/v1/contactos/:id` with `Nombre=null` returns 400 + Problem Details with `errors` object (xUnit) — TC-E3-3-4-API-2
  - [x] **Backend API — P1**: `PUT /api/v1/contactos/{unknown-uuid}` returns 404 + Problem Details (xUnit) — TC-E3-3-4-API-3
  - [x] **Backend API — P2**: `PUT /api/v1/contactos/:id` with Email already used by another contact returns 409 + Problem Details "El email ya está registrado" (xUnit) — TC-E3-3-4-API-4
  - [x] **Backend unit — P2**: `UpdateContactoRequestValidator` rejects null Nombre, null Cargo, null Telefono, null Email individually (4 xUnit unit tests) — TC-E3-3-4-UNIT-1 through UNIT-4
  - [x] **Frontend component — P1**: open edit form with fixture contacto, assert all four input values match fixture (Vitest + RTL + MSW) — tests AC #1, risk R-007
  - [x] **Frontend component — P1**: modify Nombre field, click Cancel, assert original Nombre still shown in detail view (Vitest + RTL + MSW) — tests AC #4, risk R-008
  - [x] **Frontend component — P1**: clear Nombre field, submit → inline error appears, no PUT called (MSW assert) (Vitest + RTL + MSW) — tests AC #3
  - [x] **Frontend component — P2**: submit valid edit form → success toast "Contacto actualizado correctamente" appears (Vitest + RTL + MSW) — tests AC #2, risk R-010
  - [x] **Frontend component — P2**: submit edit form with 409 response → inline error "El email ya está registrado" on Email field (Vitest + RTL + MSW)
  - [ ] **E2E — P1**: edit contact end-to-end → updated Nombre appears in list and detail view without page reload (Playwright, R-002) — deferred (requires running app + seeded data)

## Dev Notes

### Architecture Context

This story wires the edit path for Epic 3's contact management feature. It follows the exact same pattern established in Story 2.4 (Edit Client) applied to the contactos domain:
- `PUT /api/v1/contactos/:id` backend endpoint (Application Command + Infrastructure UpdateAsync)
- `useUpdateContacto` TanStack Query mutation hook with `invalidateQueries(['contactos'])` on success (FR27, R-002)
- Extended `ContactoForm` supporting both create (Story 3.3) and edit modes via optional `contactoId`/`defaultValues` props
- "Editar" button in `ContactoDetailView` that opens the form pre-filled

**Scope boundary (CRITICAL):** This story covers **edit only**. The `ContactoForm` component was built in Story 3.3 with `defaultValues` prop support reserved for this story. Do NOT rewrite `ContactoForm` from scratch — extend it with edit-mode props while keeping the create-mode path fully functional.

**Pre-fill pattern:** Pass `defaultValues` from the loaded `ContactoDto` directly to `useForm({ defaultValues })`. React Hook Form uses these as initial values. The cancel button calls `onClose()` without mutation — the form instance is discarded, so the original TanStack Query cache remains valid (AC: #4, R-008 mitigation).

**FR27 — Immediate updates after edit:** `queryClient.invalidateQueries({ queryKey: ['contactos'] })` in `useUpdateContacto`'s `onSuccess` triggers automatic refetch of both the list (`['contactos']`) and any cached single-contact query. The `ContactoDetailView` also calls `refetch()` via its `onSuccess` callback to update the detail panel immediately.

**Invalidation keys — both required after edit:**
```typescript
queryClient.invalidateQueries({ queryKey: ['contactos'] });        // list panel (covers both list and single)
// The detail view's onSuccess handler calls refetch() directly on useContacto(id)
```
Preferred pattern: in `useUpdateContacto.onSuccess`, invalidate `['contactos']` (without `exact: true`) — this invalidates the list and the `['contactos', id]` single-contact query, ensuring `ContactoListView` and `ContactoDetailView` both reflect the updated data.

**Email uniqueness:** The DB has `uk_contactos_email` unique index (added in Story 3.1 AI review). On update, if the new email conflicts with another contact, PostgreSQL will throw a `DbUpdateException` with code `23505`. The endpoint catches this and returns 409. The frontend `useUpdateContacto` mutation's `onError` handles 409 by calling `setError('email', { message: 'El email ya está registrado' })`.

**409 handling:** Same pattern as Story 3.3 create flow. Keep `onError` handling in the `ContactoForm` component via `mutate(data, { onError: ..., onSuccess: ... })` — do NOT put it in the hook's `onError`.

**MasterCrud note:** MasterCrud is NOT used here. The established pattern for this project is a custom form (React Hook Form + Zod) inside a modal overlay, consistent with Stories 2.3, 2.4, and 3.3.

### Backend: `PUT /api/v1/contactos/:id` — New Implementation

The endpoint is NOT yet implemented. Based on the analog `PUT /api/v1/clientes/:id` from Story 2.4:

```csharp
// backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs — add:
group.MapPut("/{id:guid}", async (
    Guid id,
    UpdateContactoRequest request,
    UpdateContactoRequestValidator validator,
    UpdateContactoCommandHandler handler,
    CancellationToken ct) =>
{
    var validation = await validator.ValidateAsync(request, ct);
    if (!validation.IsValid)
        return Results.ValidationProblem(validation.ToDictionary());

    try
    {
        var dto = await handler.HandleAsync(new UpdateContactoCommand(id, request.Nombre, request.Cargo, request.Telefono, request.Email), ct);
        if (dto is null)
            return Results.Problem(
                detail: "El contacto solicitado no fue encontrado.",
                statusCode: 404,
                title: "Contacto no encontrado");
        return Results.Ok(dto);
    }
    catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
    {
        return Results.Problem(
            detail: "El email ya está registrado",
            statusCode: 409,
            title: "Conflicto de datos");
    }
});
```

**Response shape — success (200 OK):**
```json
{
  "id": "uuid",
  "nombre": "María López",
  "cargo": "Directora Comercial",
  "telefono": "3009876543",
  "email": "maria.lopez@empresa.com",
  "clienteId": null,
  "createdAt": "2026-06-01T10:00:00Z",
  "updatedAt": "2026-06-28T14:30:00Z"
}
```

**Response shape — not found (404, Problem Details RFC 7807):**
```json
{
  "title": "Contacto no encontrado",
  "status": 404,
  "detail": "El contacto solicitado no fue encontrado."
}
```

**Response shape — validation error (400, Problem Details RFC 7807):**
```json
{
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": { "Nombre": ["'Nombre' must not be empty."] }
}
```

**Response shape — email conflict (409, Problem Details RFC 7807):**
```json
{
  "title": "Conflicto de datos",
  "status": 409,
  "detail": "El email ya está registrado"
}
```

### ContactoEntity.Update method

```csharp
// backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs — add method:
public void Update(string nombre, string cargo, string telefono, string email)
{
    ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
    ArgumentException.ThrowIfNullOrWhiteSpace(cargo);
    ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
    ArgumentException.ThrowIfNullOrWhiteSpace(email);
    Nombre = nombre;
    Cargo = cargo;
    Telefono = telefono;
    Email = email;
    UpdatedAt = DateTimeOffset.UtcNow; // NEVER DateTime
}
```

### Frontend: useUpdateContacto Hook

```typescript
// frontend/src/modules/crm/contactos/application/useUpdateContacto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { contactoApiRepository } from '../infrastructure/contactoApiRepository';
import type { ContactoFormData } from './contactoSchema';

export const useUpdateContacto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContactoFormData }) =>
      contactoApiRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      toast.success('Contacto actualizado correctamente');
    },
  });
};
```

**CRITICAL:** `invalidateQueries({ queryKey: ['contactos'] })` — NOT `['contacto']` (singular). No `exact: true` — broad invalidation refreshes both list (`['contactos']`) and single-contact (`['contactos', id]`) queries.

**409 handling at component level (not in hook):** Expose `onError` in `ContactoForm` via `mutate(data, { onError: ..., onSuccess: ... })` — same pattern as Story 3.3.

### Frontend: contactoApiRepository — update extension

```typescript
// Add to frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts
update: async (id: string, data: ContactoFormData): Promise<Contacto> => {
  const response = await apiClient.put<Contacto>(`/api/v1/contactos/${id}`, data);
  return response.data;
},
```

### Frontend: ContactoForm — Edit Mode Extension

```typescript
// frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx — extend existing component
import { useCreateContacto } from '../application/useCreateContacto';
import { useUpdateContacto } from '../application/useUpdateContacto';

interface ContactoFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  defaultValues?: Partial<ContactoFormData>;
  contactoId?: string; // undefined = create mode; defined = edit mode
}

export function ContactoForm({ onClose, onSuccess, defaultValues, contactoId }: ContactoFormProps) {
  const isEditMode = !!contactoId;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ContactoFormData>({
    resolver: zodResolver(contactoSchema),
    defaultValues,
  });

  const createMutation = useCreateContacto();
  const updateMutation = useUpdateContacto();
  const { mutate, isPending } = isEditMode ? updateMutation : createMutation;

  const onSubmit = (data: ContactoFormData) => {
    const mutateArgs = isEditMode ? { id: contactoId!, data } : data;
    (mutate as (args: typeof mutateArgs, options: object) => void)(mutateArgs, {
      onError: (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          setError('email', { message: 'El email ya está registrado' });
        } else {
          setError('root', {
            message: isEditMode
              ? 'Error al actualizar el contacto. Intente nuevamente.'
              : 'Error al crear el contacto. Intente nuevamente.',
          });
        }
      },
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid="contacto-form">
      {errors.root && <span role="alert">{errors.root.message}</span>}
      {/* Nombre, Cargo, Teléfono, Email fields — same as Story 3.3 */}
      <button type="button" onClick={onClose} data-testid="btn-cancel">
        Cancelar
      </button>
      <button type="submit" disabled={isPending} data-testid="btn-submit">
        {isPending ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear contacto'}
      </button>
    </form>
  );
}
```

**Note:** The `mutate` call signature differs between create and edit modes. Prefer a conditional approach that directly calls the correct mutation to avoid complex TypeScript generics:
```typescript
const onSubmit = (data: ContactoFormData) => {
  if (isEditMode) {
    updateMutation.mutate({ id: contactoId!, data }, { onError, onSuccess: handleSuccess });
  } else {
    createMutation.mutate(data, { onError, onSuccess: handleSuccess });
  }
};
```

### Frontend: "Editar" Button in ContactoDetailView

```typescript
// frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx — extend
const [isEditFormOpen, setIsEditFormOpen] = useState(false);

// In the data-loaded section only (not loading/error/not-found):
<>
  <div data-testid="contacto-detail-view">
    {/* existing detail fields */}
    <button
      onClick={() => setIsEditFormOpen(true)}
      data-testid="btn-editar"
      className="rounded bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white hover:bg-[#154ca9]"
    >
      Editar
    </button>
  </div>
  {isEditFormOpen && (
    <div role="dialog" aria-modal="true">
      <ContactoForm
        contactoId={contacto.id}
        defaultValues={{
          nombre: contacto.nombre,
          cargo: contacto.cargo,
          telefono: contacto.telefono,
          email: contacto.email,
        }}
        onClose={() => setIsEditFormOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  )}
</>
```

### Project Structure Notes

**Files to create (backend):**
```
backend/src/SiesaAgents.Application/Contactos/
├── DTOs/UpdateContactoRequest.cs                      ← CREATE
├── Validators/UpdateContactoRequestValidator.cs        ← CREATE
├── Commands/UpdateContactoCommand.cs                  ← CREATE
└── Commands/UpdateContactoCommandHandler.cs           ← CREATE

backend/tests/SiesaAgents.UnitTests/Contactos/
├── UpdateContactoApiTests.cs                          ← CREATE (P1 + P2 API tests)
└── UpdateContactoValidatorTests.cs                    ← CREATE (P2 unit tests — 4 tests)
```

**Files to modify (backend):**
```
backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs            ← MODIFY (add Update method)
backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs     ← MODIFY (add UpdateAsync)
backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs      ← MODIFY (implement UpdateAsync)
backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs                     ← MODIFY (add MapPut)
backend/src/SiesaAgents.API/Program.cs                                         ← MODIFY (register handler + validator)
```

**Files to create (frontend):**
```
frontend/src/modules/crm/contactos/application/useUpdateContacto.ts           ← CREATE
```

**Files to modify (frontend):**
```
frontend/src/modules/crm/contactos/domain/IContactoRepository.ts              ← MODIFY (add update)
frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts    ← MODIFY (add update method)
frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx              ← MODIFY (add edit mode)
frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx        ← MODIFY (add "Editar" button + dialog)
```

**Verify from prior stories (do NOT recreate):**
```
frontend/src/modules/crm/contactos/application/contactoSchema.ts              ← EXISTS (Story 3.1) — reuse for edit
frontend/src/modules/crm/contactos/application/useCreateContacto.ts           ← EXISTS (Story 3.3) — do NOT break
frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx              ← EXISTS (Story 3.3) — extend only
frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx        ← EXISTS (Story 3.2) — extend only
frontend/src/shared/lib/apiClient.ts                                           ← EXISTS (Story 1.2)
```

### TanStack Query Key Alignment

Per architecture canonical keys:
- `['contactos']` → all contacts list (`useContactos`, Story 3.1)
- `['contactos', id]` → single contact (`useContacto`, Story 3.2)

`useUpdateContacto`'s `invalidateQueries({ queryKey: ['contactos'] })` (without `exact: true`) invalidates both the list and the per-id cache, ensuring both `ContactoListView` and `ContactoDetailView` reflect the updated contact.

### Testing Approach

**Backend API integration tests** use `WebApplicationFactory<Program>` + Testcontainers PostgreSQL (established in Story 1.3). Reuse `contactoFactory` builder from Stories 3.1–3.3. Key scenarios:
- PUT valid payload → 200 + `ContactoDto` shape with updated fields + updated `updatedAt` (later than `createdAt`)
- PUT unknown uuid → 404 Problem Details
- PUT Nombre=null → 400 Problem Details with `errors` object
- PUT with email used by another contact → 409 Problem Details

**Frontend component tests** use Vitest + RTL + MSW 2.x. Reuse `contactoFixture` from Stories 3.1–3.3:
- MSW handler: `http.put('/api/v1/contactos/:id', resolver)` responding with 200 fixture
- Override handler per test for 409/400/404 scenarios
- R-007 mitigation: assert each input `.value` matches fixture before submit
- R-008 mitigation: modify field, click cancel, assert original value in detail view

**Key test IDs (from test-design-epic-3.md):**

| Test ID | Level | Scenario | Priority |
|---------|-------|----------|---------|
| TC-E3-3-4-API-1 | API | PUT valid payload → 200 + updated ContactoDto | P1 |
| TC-E3-3-4-API-2 | API | PUT Nombre=null → 400 Problem Details with errors | P1 |
| TC-E3-3-4-API-3 | API | PUT unknown uuid → 404 Problem Details | P1 |
| TC-E3-3-4-API-4 | API | PUT duplicate email → 409 Problem Details | P2 |
| TC-E3-3-4-UNIT-1 | Unit | UpdateContactoRequestValidator rejects null Nombre | P2 |
| TC-E3-3-4-UNIT-2 | Unit | UpdateContactoRequestValidator rejects null Cargo | P2 |
| TC-E3-3-4-UNIT-3 | Unit | UpdateContactoRequestValidator rejects null Telefono | P2 |
| TC-E3-3-4-UNIT-4 | Unit | UpdateContactoRequestValidator rejects null Email | P2 |
| TC-E3-3-4-CMP-1 | Component | Edit form pre-fills all four fields from fixture | P1 |
| TC-E3-3-4-CMP-2 | Component | Cancel edit restores original values | P1 |
| TC-E3-3-4-CMP-3 | Component | Clear required field + submit → inline error, no PUT | P1 |
| TC-E3-3-4-CMP-4 | Component | Valid edit submit → toast "Contacto actualizado correctamente" | P2 |
| TC-E3-3-4-CMP-5 | Component | 409 response → Email field inline error | P2 |
| TC-E3-3-4-E2E-1 | E2E | Full edit journey → updated data in list + detail, no reload | P1 |

### Enforcement Checklist (Must Verify Before Marking Done)

- [ ] `PUT /api/v1/contactos/:id` returns 200 (not 201) on success
- [ ] Response body is `ContactoDto` with `DateTimeOffset` fields — NEVER `DateTime`
- [ ] `updatedAt` is updated on successful `PUT` — verify it is later than `createdAt`
- [ ] 404 response uses `Results.Problem(...)` with Problem Details RFC 7807
- [ ] 409 response uses `Results.Problem(...)` with Problem Details RFC 7807
- [ ] 400 validation error uses `Results.ValidationProblem(...)` — NOT raw string
- [ ] No stack traces in any error response (NFR6) — `ExceptionHandlingMiddleware` from Story 1.3 remains active
- [ ] `queryClient.invalidateQueries({ queryKey: ['contactos'] })` called in `useUpdateContacto` `onSuccess` (FR27, R-002)
- [ ] Toast displays exactly "Contacto actualizado correctamente" in Spanish (R-010)
- [ ] Inline error on Email field displays exactly "El email ya está registrado" on 409 (NFR6)
- [ ] Form does NOT submit to backend when Zod validation fails (client-side guard)
- [ ] `ContactoForm` submit button is disabled (`disabled={isPending}`) during mutation
- [ ] All user-facing labels and messages in Spanish: "Nombre", "Cargo", "Teléfono", "Email", "Guardar cambios", "Cancelar", "Editar"
- [ ] No `any` type in TypeScript — strict mode enforced
- [ ] `contactoSchema.ts` reused from Story 3.1 — NOT duplicated
- [ ] Create mode in `ContactoForm` (Story 3.3 path) remains fully functional — do NOT break it
- [ ] `data-testid="contacto-form"` on `<form>` element
- [ ] `data-testid="btn-editar"` on trigger button in `ContactoDetailView`
- [ ] `data-testid="btn-submit"` and `data-testid="btn-cancel"` on form buttons
- [ ] `data-testid` attributes on all inputs: `input-nombre`, `input-cargo`, `input-telefono`, `input-email`
- [ ] `aria-describedby` on each input pointing to its error span `id` (WCAG 2.1 AA)
- [ ] "Editar" button is visible ONLY in the data-loaded state (not during skeleton/error/not-found)
- [ ] Cancel button does NOT mutate TanStack Query cache (R-008) — no API call on cancel
- [ ] Backend error responses use Problem Details RFC 7807 — no stack traces exposed

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md#Story 3.4`]
- Architecture — FR14 (edit contact with pre-filled form): [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`]
- Architecture — FR27 (immediate list update via invalidateQueries): [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- Architecture — FR16 (inline validation errors): [Source: `_bmad-output/planning-artifacts/prd/functional-requirements.md`]
- Architecture — `PUT /api/v1/contactos/:id` endpoint: [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Architecture — Frontend folder structure (contactos module): [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- Architecture — Enforcement guidelines (Problem Details, Spanish text, DateTimeOffset, no any): [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`]
- Test design — TC-E3-3-4 test scenarios, R-007, R-008, R-002, R-010 risks: [Source: `_bmad-output/test-design-epic-3.md#4. Test Coverage Plan`]
- Preceding story — ContactoForm with defaultValues support (reserved for this story), useCreateContacto, contactoSchema: [Source: `_bmad-output/implementation-artifacts/3-3-create-contact.md`]
- Preceding story — ContactoDetailView, useContacto(['contactos', id]): [Source: `_bmad-output/implementation-artifacts/3-2-contact-detail-view.md`]
- Preceding story — IContactoRepository, ContactoEntity.Create, uk_contactos_email index: [Source: `_bmad-output/implementation-artifacts/3-1-contact-list-search.md`]
- Analog story — useUpdateCliente, UpdateClienteCommand, ClienteForm edit mode, ClienteDetailView "Editar" button: [Source: `_bmad-output/implementation-artifacts/2-4-edit-client.md`]
- Company standards — React Hook Form + Zod, TanStack Query mutations, DateTimeOffset: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack`]
- Company standards — FluentValidation, Minimal API, Problem Details RFC 7807: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack`]
- Company standards — Spanish user-facing text, WCAG 2.1 AA: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- `ContactoEntity.Update` method was already present from a prior partial implementation — confirmed and reused.
- ATDD backend test files (`UpdateContactoApiTests.cs`, `UpdateContactoValidatorTests.cs`) already existed from the ATDD phase — all 19 tests turned GREEN with this implementation.
- Existing `ContactoForm.test.tsx` and `ContactoForm.edge.test.tsx` (44 tests) all pass after extending the form with edit mode — create mode path fully preserved.
- E2E test (TC-E3-3-4-E2E-1) is deferred per story spec — requires running app + seeded data.

### File List

**Created (backend):**
- `/home/user/lab-sa-quick-dev/backend/src/SiesaAgents.Application/Contactos/DTOs/UpdateContactoRequest.cs`
- `/home/user/lab-sa-quick-dev/backend/src/SiesaAgents.Application/Contactos/Validators/UpdateContactoRequestValidator.cs`
- `/home/user/lab-sa-quick-dev/backend/src/SiesaAgents.Application/Contactos/Commands/UpdateContactoCommand.cs`
- `/home/user/lab-sa-quick-dev/backend/src/SiesaAgents.Application/Contactos/Commands/UpdateContactoCommandHandler.cs`

**Modified (backend):**
- `/home/user/lab-sa-quick-dev/backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs` — added `UpdateAsync`
- `/home/user/lab-sa-quick-dev/backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` — implemented `UpdateAsync`
- `/home/user/lab-sa-quick-dev/backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` — added `MapPut`
- `/home/user/lab-sa-quick-dev/backend/src/SiesaAgents.API/Program.cs` — registered `UpdateContactoCommandHandler` and `UpdateContactoRequestValidator`

**Created (frontend):**
- `/home/user/lab-sa-quick-dev/frontend/src/modules/crm/contactos/application/useUpdateContacto.ts`
- `/home/user/lab-sa-quick-dev/frontend/src/modules/crm/contactos/__tests__/UpdateContacto.test.tsx`

**Modified (frontend):**
- `/home/user/lab-sa-quick-dev/frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — added `update`
- `/home/user/lab-sa-quick-dev/frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — added `update` method
- `/home/user/lab-sa-quick-dev/frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx` — added edit mode support
- `/home/user/lab-sa-quick-dev/frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx` — added "Editar" button + dialog
