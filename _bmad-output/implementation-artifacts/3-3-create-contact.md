# Story 3.3: Create Contact

Status: ready

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new contact by filling in a form,
so that the contact is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/contactos` view, **When** the user clicks "Nuevo contacto", **Then** a form opens with fields: Nombre, Cargo, Teléfono, Email (all required per FR9).

2. **Given** the user fills all required fields and submits the form, **When** the form is submitted, **Then** the contact is created via `POST /api/v1/contactos`, appears in the contact list immediately without page reload (FR27), **And** a success toast displays "Contacto creado correctamente".

3. **Given** the user submits the form with one or more required fields empty, **When** the form is validated (client-side Zod), **Then** clear inline error messages appear on the empty fields (FR16), **And** the form is NOT submitted to the backend.

4. **Given** the backend returns a validation error (400) or conflict (409), **When** the error is received, **Then** the error message is displayed clearly without exposing technical details (NFR6).

## Tasks / Subtasks

- [ ] Task 1 — Backend: Verify `POST /api/v1/contactos` endpoint is complete (AC: #2, #3, #4)
  - [ ] Verify `POST /` endpoint exists in `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` — confirmed present from Story 3.1; uses `CreateContactoRequestValidator` (FluentValidation), calls `ContactoEntity.Create()`, persists via `IContactoRepository.AddAsync` + `SaveChangesAsync`, returns `Results.Created(...)` (201) on success, `Results.ValidationProblem(...)` (400) on invalid input, `Results.Problem(statusCode: 409, ...)` on unique email conflict
  - [ ] Verify `CreateContactoRequest` record exists in `backend/src/SiesaAgents.Application/Contactos/DTOs/CreateContactoRequest.cs` — confirmed present from Story 3.1
  - [ ] Verify `CreateContactoRequestValidator` exists in `backend/src/SiesaAgents.Application/Contactos/Validators/CreateContactoRequestValidator.cs` — confirmed present from Story 3.1; validates NotEmpty + MaximumLength for all 4 fields; Email validated with `.EmailAddress()`
  - [ ] Verify `IContactoRepository.AddAsync` and `SaveChangesAsync` are declared and implemented — confirmed present from Story 3.1
  - [ ] No new backend files needed; endpoint is already implemented in Story 3.1

- [ ] Task 2 — Frontend: Application layer — `useCreateContacto` mutation hook (AC: #2, #4)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useCreateContacto.ts` — TanStack Query `useMutation`:
    - `mutationFn: (data: ContactoFormData) => contactoApiRepository.create(data)`
    - `onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contactos'] }); toast.success('Contacto creado correctamente'); }` — FR27 immediate list update via cache invalidation (R-002 mitigation)
    - Export `useCreateContacto` as named export
  - [ ] Extend `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — add `create(data: ContactoFormData): Promise<Contacto>`
  - [ ] Extend `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — add `create(data: ContactoFormData)` method: `POST /api/v1/contactos` via `apiClient`; returns `response.data`
  - [ ] Verify `frontend/src/modules/crm/contactos/application/contactoSchema.ts` exists (created in Story 3.1); exports `contactoSchema` (Zod) and `ContactoFormData` type — do NOT recreate

- [ ] Task 3 — Frontend: Presentation layer — `ContactoForm` component (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx`:
    - Uses `react-hook-form` with `zodResolver(contactoSchema)` for client-side validation
    - Fields: `Nombre` (label `"Nombre"`, `data-testid="input-nombre"`), `Cargo` (label `"Cargo"`, `data-testid="input-cargo"`), `Teléfono` (label `"Teléfono"`, `data-testid="input-telefono"`), `Email` (label `"Email"`, `data-testid="input-email"`) — all required
    - Each input has `aria-describedby` pointing to its error span `id` for WCAG 2.1 AA compliance
    - Inline error messages below each field (from `formState.errors`) rendered as `<span role="alert">` with matching `id`
    - Submit button `"Crear contacto"` (`data-testid="btn-submit"`) — disabled while mutation `isPending`; shows `"Creando..."` while pending
    - Cancel button `"Cancelar"` (`data-testid="btn-cancel"`) — calls `onClose` prop; never submits
    - On submit: calls `mutate(data, { onError, onSuccess })` from `useCreateContacto`
    - On 409 from mutation `onError`: sets form error on `email` field via `setError('email', { message: 'El email ya está registrado' })` (NFR6 — no technical details)
    - On 400 from mutation `onError` (non-409): displays generic error message "Error al crear el contacto. Intente nuevamente." without stack traces
    - On `onSuccess`: calls `onClose()` and optional `onSuccess?.()` callback
    - Props: `onClose: () => void`, `onSuccess?: () => void`
    - All user-facing text in Spanish; no `any` TypeScript types
    - `data-testid="contacto-form"` on the `<form>` element

- [ ] Task 4 — Frontend: "Nuevo contacto" button wiring (AC: #1)
  - [ ] Update `frontend/src/routes/_app/contactos.tsx` — add "Nuevo contacto" button (`data-testid="btn-nuevo-contacto"`) in the page header; clicking it sets local `useState<boolean>` `isFormOpen = true`
  - [ ] Render `<ContactoForm onClose={() => setIsFormOpen(false)} />` conditionally when `isFormOpen === true` — displayed as accessible modal overlay (`role="dialog"`) using shadcn/ui Dialog component (install via MCP if not present; mirrors `ClienteForm` wiring from Story 2.3)
  - [ ] Update `frontend/src/routes/_app/contactos.$contactoId.tsx` — add the same "Nuevo contacto" button so it is available when a contact detail is open

- [ ] Task 5 — Tests (AC: #1, #2, #3, #4) — aligned with test-design-epic-3.md
  - [ ] **Backend API — P0**: `POST /api/v1/contactos` with valid payload returns 201 + `ContactoDto` JSON (xUnit, WebApplicationFactory)
  - [ ] **Backend API — P0**: re-`GET /api/v1/contactos` after POST confirms new contact in list (xUnit, WebApplicationFactory)
  - [ ] **Backend API — P1**: `POST /api/v1/contactos` with empty body → 400 + Problem Details with `errors` object (xUnit)
  - [ ] **Backend API — P1**: `POST /api/v1/contactos` same email twice → second returns 409 + Problem Details "El email ya está registrado" (documents R-001 behavior) (xUnit)
  - [ ] **Backend unit — P2**: `CreateContactoRequestValidator` rejects null Nombre, null Cargo, null Telefono, null Email individually (4 xUnit unit tests)
  - [ ] **Frontend component — P0**: submit empty `ContactoForm` → 4 inline error messages appear; MSW handler asserts `POST /api/v1/contactos` never called (Vitest + RTL + MSW)
  - [ ] **Frontend component — P2**: submit `ContactoForm` with 409 response → inline error "El email ya está registrado" on Email field (Vitest + RTL + MSW)
  - [ ] **Frontend component — P2**: submit valid `ContactoForm` → success toast "Contacto creado correctamente" appears (Vitest + RTL + MSW)
  - [ ] **E2E — P1**: fill form (Nombre, Cargo, Teléfono, Email), submit, assert success toast, assert contact Nombre appears in list without page reload (Playwright, TC-E3-3-3-E2E-1, R-002) — deferred (requires running app + seeded data)

## Dev Notes

### Architecture Context

This story adds the create path to Epic 3's contact management feature. It introduces:
- `useCreateContacto` TanStack Query mutation hook with `invalidateQueries(['contactos'])` on success (FR27, R-002)
- `ContactoForm` React Hook Form + Zod component (shared with Story 3.4 edit path; add `defaultValues` prop support for reuse)
- "Nuevo contacto" button in the `/contactos` and `/contactos/:contactoId` routes

**Scope boundary (CRITICAL):** This story covers **create only**. The `ContactoForm` component is built to accept optional `defaultValues` for reuse in Story 3.4 (edit), but the pre-fill logic and `PUT` mutation are NOT implemented here. Do NOT wire edit functionality.

**Backend already implemented (CRITICAL):** The `POST /api/v1/contactos` endpoint, `CreateContactoRequest` DTO, and `CreateContactoRequestValidator` are all **fully implemented in Story 3.1** (`ContactoEndpoints.cs` lines 35–62). No new backend source files are needed. Verify the existing implementation before proceeding.

**FR27 — Immediate list update:** `queryClient.invalidateQueries({ queryKey: ['contactos'] })` in `useCreateContacto`'s `onSuccess` triggers an automatic refetch of the `['contactos']` query (from `useContactos` in `ContactoListView`), updating the list without page reload. This is the R-002 mitigation — must be tested.

**409 conflict handling:** The backend catches `DbUpdateException` with PostgreSQL unique constraint code `23505` (email uniqueness via `uk_contactos_email` index from Story 3.1 AI review fix) and returns 409 Problem Details. The frontend `useCreateContacto` mutation's `onError` detects 409 via `axios.isAxiosError(error) && error.response?.status === 409` and calls `setError('email', ...)` on the React Hook Form instance. Note: per R-001 the PRD does not require email uniqueness across contacts, but the DB now enforces it via the index added in the Story 3.1 AI review — this story must handle it gracefully.

**MasterCrud note:** MasterCrud is NOT used here. The established pattern for this project is a custom form (React Hook Form + Zod) inside a Dialog, consistent with Story 2.3 (`ClienteForm`).

### Backend: POST /api/v1/contactos — ALREADY IMPLEMENTED

The endpoint exists in `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` (lines 35–62):

```csharp
group.MapPost("/", async (
    CreateContactoRequest request,
    CreateContactoRequestValidator validator,
    IContactoRepository repo,
    CancellationToken ct) =>
{
    var validation = await validator.ValidateAsync(request, ct);
    if (!validation.IsValid)
        return Results.ValidationProblem(validation.ToDictionary());

    try
    {
        var contacto = ContactoEntity.Create(request.Nombre, request.Cargo, request.Telefono, request.Email);
        await repo.AddAsync(contacto, ct);
        await repo.SaveChangesAsync(ct);
        var dto = new ContactoDto(
            contacto.Id, contacto.Nombre, contacto.Cargo, contacto.Telefono,
            contacto.Email, contacto.ClienteId, contacto.CreatedAt, contacto.UpdatedAt);
        return Results.Created($"/api/v1/contactos/{contacto.Id}", dto);
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

Response shape — success (201 Created):
```json
{
  "id": "uuid",
  "nombre": "María López",
  "cargo": "Gerente Comercial",
  "telefono": "3001234567",
  "email": "maria.lopez@empresa.com",
  "clienteId": null,
  "createdAt": "2026-06-28T10:30:00Z",
  "updatedAt": "2026-06-28T10:30:00Z"
}
```

Response shape — validation error (400, Problem Details RFC 7807):
```json
{
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": { "Nombre": ["'Nombre' must not be empty."] }
}
```

Response shape — email conflict (409, Problem Details RFC 7807):
```json
{
  "title": "Conflicto de datos",
  "status": 409,
  "detail": "El email ya está registrado"
}
```

### Frontend: useCreateContacto Hook

```typescript
// frontend/src/modules/crm/contactos/application/useCreateContacto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { contactoApiRepository } from '../infrastructure/contactoApiRepository';
import type { ContactoFormData } from './contactoSchema';

export const useCreateContacto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ContactoFormData) => contactoApiRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      toast.success('Contacto creado correctamente');
    },
  });
};
```

**CRITICAL:** `invalidateQueries({ queryKey: ['contactos'] })` — NOT `['contacto']` (singular). This invalidates both `['contactos']` (list) cache key used by `useContactos` in `ContactoListView`. Do NOT pass `exact: true` — broad invalidation ensures both list and any future derived queries are refreshed.

**409 handling at component level (not in hook):** Keep `onSuccess` in the hook. Expose `onError` handling in `ContactoForm` via `mutate(data, { onError: ..., onSuccess: ... })` pattern — same as Story 2.3.

### Frontend: contactoApiRepository — create extension

```typescript
// Add to frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts
create: async (data: ContactoFormData): Promise<Contacto> => {
  const response = await apiClient.post<Contacto>('/api/v1/contactos', data);
  return response.data;
},
```

Import `ContactoFormData` from `../application/contactoSchema`.

### Frontend: IContactoRepository — create extension

```typescript
// Add to frontend/src/modules/crm/contactos/domain/IContactoRepository.ts
create(data: ContactoFormData): Promise<Contacto>;
```

Import `ContactoFormData` from `../application/contactoSchema`.

### Frontend: ContactoForm — Key Implementation Points

```typescript
// frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { contactoSchema, type ContactoFormData } from '../application/contactoSchema';
import { useCreateContacto } from '../application/useCreateContacto';

interface ContactoFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  defaultValues?: Partial<ContactoFormData>; // reserved for Story 3.4 edit reuse
}

export function ContactoForm({ onClose, onSuccess, defaultValues }: ContactoFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ContactoFormData>({
    resolver: zodResolver(contactoSchema),
    defaultValues,
  });

  const { mutate, isPending } = useCreateContacto();

  const onSubmit = (data: ContactoFormData) => {
    mutate(data, {
      onError: (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          setError('email', { message: 'El email ya está registrado' });
        } else {
          setError('root', { message: 'Error al crear el contacto. Intente nuevamente.' });
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
      <div>
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          {...register('nombre')}
          data-testid="input-nombre"
          aria-describedby="error-nombre"
        />
        {errors.nombre && <span id="error-nombre" role="alert">{errors.nombre.message}</span>}
      </div>
      <div>
        <label htmlFor="cargo">Cargo</label>
        <input
          id="cargo"
          {...register('cargo')}
          data-testid="input-cargo"
          aria-describedby="error-cargo"
        />
        {errors.cargo && <span id="error-cargo" role="alert">{errors.cargo.message}</span>}
      </div>
      <div>
        <label htmlFor="telefono">Teléfono</label>
        <input
          id="telefono"
          {...register('telefono')}
          data-testid="input-telefono"
          aria-describedby="error-telefono"
        />
        {errors.telefono && <span id="error-telefono" role="alert">{errors.telefono.message}</span>}
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          data-testid="input-email"
          aria-describedby="error-email"
        />
        {errors.email && <span id="error-email" role="alert">{errors.email.message}</span>}
      </div>
      <button type="button" onClick={onClose} data-testid="btn-cancel">
        Cancelar
      </button>
      <button type="submit" disabled={isPending} data-testid="btn-submit">
        {isPending ? 'Creando...' : 'Crear contacto'}
      </button>
    </form>
  );
}
```

**Zod schema (do NOT recreate):** `contactoSchema` already exists at `frontend/src/modules/crm/contactos/application/contactoSchema.ts` from Story 3.1 with `.trim()` applied and Spanish error messages. `email` field uses `.email('El email no es válido').min(1, 'El email es requerido')`.

### Frontend: "Nuevo contacto" Button in Routes

```typescript
// frontend/src/routes/_app/contactos.tsx (update)
import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { ContactoListView } from '../../modules/crm/contactos/presentation/ContactoListView';
import { ContactoForm } from '../../modules/crm/contactos/presentation/ContactoForm';
// Dialog from shadcn/ui — install via MCP if not present

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
});

function ContactosPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Contactos</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          data-testid="btn-nuevo-contacto"
          className="rounded bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white hover:bg-[#154ca9]"
        >
          Nuevo contacto
        </button>
      </div>
      <ContactoListView />
      {isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo contacto</DialogTitle>
            </DialogHeader>
            <ContactoForm onClose={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
```

Apply the same pattern to `contactos.$contactoId.tsx` so the "Nuevo contacto" button is also available in the detail view.

### Project Structure Notes

**Files to create:**

```
frontend/
└── src/
    └── modules/crm/contactos/
        ├── application/useCreateContacto.ts         ← CREATE
        ├── presentation/ContactoForm.tsx             ← CREATE
        └── __tests__/ContactoForm.test.tsx           ← CREATE
```

**Files to modify:**

```
frontend/
└── src/
    ├── modules/crm/contactos/
    │   ├── domain/IContactoRepository.ts            ← MODIFY (add create)
    │   └── infrastructure/contactoApiRepository.ts  ← MODIFY (add create method)
    └── routes/_app/
        ├── contactos.tsx                            ← MODIFY (add button + Dialog)
        └── contactos.$contactoId.tsx               ← MODIFY (add button + Dialog)
```

**Backend — no new files needed:**

```
backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs     ← VERIFY only (POST already present)
backend/src/SiesaAgents.Application/Contactos/DTOs/            ← VERIFY only (CreateContactoRequest present)
backend/src/SiesaAgents.Application/Contactos/Validators/      ← VERIFY only (validator present)
```

**Backend tests — new file:**

```
backend/tests/SiesaAgents.UnitTests/Contactos/
├── CreateContactoApiTests.cs          ← CREATE (P0 + P1 + R-001 API tests)
└── CreateContactoValidatorTests.cs    ← CREATE (P2 unit tests — 4 tests)
```

**Verify from prior stories (do NOT recreate):**

```
frontend/src/modules/crm/contactos/application/contactoSchema.ts  ← EXISTS (Story 3.1)
frontend/src/modules/crm/contactos/domain/Contacto.ts              ← EXISTS (Story 3.1)
frontend/src/modules/crm/contactos/application/useContactos.ts     ← EXISTS (Story 3.1)
frontend/src/shared/lib/apiClient.ts                               ← EXISTS (Story 1.2)
```

### TanStack Query Key Alignment

Per architecture canonical keys:
- `['contactos']` → all contacts (`useContactos`, Story 3.1)
- `['contactos', id]` → single contact (`useContacto`, Story 3.2)

`useCreateContacto`'s `invalidateQueries({ queryKey: ['contactos'] })` (without `exact: true`) invalidates both the list key AND any per-id keys, ensuring `ContactoListView` and `ContactoDetailView` both reflect the new contact.

### Testing Approach

**Backend API integration tests** use `WebApplicationFactory<Program>` + Testcontainers PostgreSQL (established in Story 1.3). Key scenarios:
- POST with valid payload → 201 + `ContactoDto` shape (all 4 fields + `id`, `clienteId: null`, `DateTimeOffset` timestamps)
- POST same email twice → 409 + Problem Details containing "email" (R-001 behavior documented)
- POST empty body → 400 + Problem Details with `errors` object
- POST with 255-char Nombre → 201; 256-char → 400 (P3, optional)

**Frontend component tests** use Vitest + RTL + MSW 2.x. Reuse `contactoFactory.ts` from Story 3.1:
- MSW handler: `http.post('/api/v1/contactos', resolver)` responding with a 201 fixture
- Override handler per test for 409/400 scenarios

**Key test scenarios (from test-design-epic-3.md):**

| Test ID | Level | Scenario | Priority |
|---------|-------|----------|---------|
| TC-E3-3-3-API-1 | API | POST valid payload → 201 + ContactoDto | P0 |
| TC-E3-3-3-API-2 | API | POST + re-GET confirms record in list | P0 |
| TC-E3-3-3-API-3 | API | POST empty body → 400 Problem Details with errors | P1 |
| TC-E3-3-3-API-4 | API | POST same email twice → 409 Problem Details (R-001 doc) | P1 |
| TC-E3-3-3-UNIT-1 | Unit | Validator rejects null Nombre | P2 |
| TC-E3-3-3-UNIT-2 | Unit | Validator rejects null Cargo | P2 |
| TC-E3-3-3-UNIT-3 | Unit | Validator rejects null Telefono | P2 |
| TC-E3-3-3-UNIT-4 | Unit | Validator rejects null Email | P2 |
| TC-E3-3-3-CMP-1 | Component | Empty submit → 4 inline errors, no POST called | P0 |
| TC-E3-3-3-CMP-2 | Component | 409 response → Email field inline error | P2 |
| TC-E3-3-3-CMP-3 | Component | Valid submit → toast "Contacto creado correctamente" | P2 |
| TC-E3-3-3-E2E-1 | E2E | Full create journey → toast + Nombre in list, no reload | P1 |

### Enforcement Checklist (Must Verify Before Marking Done)

- [ ] `POST /api/v1/contactos` returns 201 (not 200) on success — endpoint already implemented
- [ ] Response body is `ContactoDto` with `DateTimeOffset` fields — NEVER `DateTime` (already enforced)
- [ ] 409 response uses `Results.Problem(...)` with Problem Details RFC 7807 — NOT raw string (already enforced)
- [ ] 400 validation error uses `Results.ValidationProblem(...)` — NOT raw string (already enforced)
- [ ] No stack traces in any error response (NFR6) — `ExceptionHandlingMiddleware` from Story 1.3 must remain active
- [ ] `queryClient.invalidateQueries({ queryKey: ['contactos'] })` called in `useCreateContacto` `onSuccess` (FR27, R-002)
- [ ] Toast displays exactly "Contacto creado correctamente" in Spanish (R-010)
- [ ] Inline error on Email field displays exactly "El email ya está registrado" on 409 (no technical details — NFR6)
- [ ] Form does NOT submit to backend when Zod validation fails (client-side guard — 4 inline errors appear)
- [ ] `ContactoForm` submit button is disabled (`disabled={isPending}`) during mutation
- [ ] All user-facing labels and messages in Spanish: "Nombre", "Cargo", "Teléfono", "Email", "Crear contacto", "Cancelar", "Nuevo contacto"
- [ ] No `any` type in TypeScript — strict mode enforced
- [ ] `contactoSchema.ts` reused from Story 3.1 — NOT duplicated
- [ ] `data-testid="contacto-form"` on `<form>` element
- [ ] `data-testid` attributes on all inputs: `input-nombre`, `input-cargo`, `input-telefono`, `input-email`
- [ ] `data-testid="btn-submit"` and `data-testid="btn-cancel"` on buttons
- [ ] `data-testid="btn-nuevo-contacto"` on the trigger button in the route
- [ ] `aria-describedby` on each input pointing to its error span `id` (WCAG 2.1 AA)
- [ ] Backend error responses use Problem Details RFC 7807 — no stack traces exposed
- [ ] "Nuevo contacto" button available on both `/contactos` and `/contactos/:contactoId` routes

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md#Story 3.3`]
- Architecture — FR9 (register contact with required fields): [Source: `_bmad-output/planning-artifacts/prd/functional-requirements.md`]
- Architecture — FR27 (immediate list update via invalidateQueries): [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- Architecture — FR16 (inline validation errors): [Source: `_bmad-output/planning-artifacts/prd/functional-requirements.md`]
- Architecture — `POST /api/v1/contactos` endpoint: [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Architecture — Frontend folder structure (contactos module): [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- Architecture — Enforcement guidelines (Problem Details, Spanish text, no any): [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`]
- Test design — TC-E3-3-3 test scenarios, R-001, R-002, R-004, R-010 risks: [Source: `_bmad-output/test-design-epic-3.md#4. Test Coverage Plan`]
- Preceding story — ContactoEntity.Create, IContactoRepository.AddAsync, POST endpoint already implemented: [Source: `_bmad-output/implementation-artifacts/3-1-contact-list-search.md`]
- Preceding story — contactoSchema, ContactoFormData, contactoApiRepository, contactoFactory: [Source: `_bmad-output/implementation-artifacts/3-1-contact-list-search.md`]
- Preceding story — useContactos query key ['contactos'], ContactoListView: [Source: `_bmad-output/implementation-artifacts/3-1-contact-list-search.md`]
- Preceding story — ContactoDetailView, useContacto(['contactos', id]), split-panel layout: [Source: `_bmad-output/implementation-artifacts/3-2-contact-detail-view.md`]
- Analog story — ClienteForm pattern (useCreateCliente, 409 handling, Dialog wiring): [Source: `_bmad-output/implementation-artifacts/2-3-create-client.md`]
- Company standards — React Hook Form + Zod, TanStack Query mutations: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack`]
- Company standards — FluentValidation, Minimal API, Problem Details RFC 7807: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack`]
- Company standards — Spanish user-facing text, WCAG 2.1 AA: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
