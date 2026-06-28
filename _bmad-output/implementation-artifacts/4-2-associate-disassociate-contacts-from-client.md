# Story 4.2: Associate & Disassociate Contacts from Client

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to associate existing contacts to a client and disassociate them directly from the client detail view,
so that I can manage the client's contact relationships without navigating away.

## Acceptance Criteria

1. **Given** the user is in the client detail view, **When** the user uses the ContactManager to add an existing contact, **Then** the contact is linked to the client immediately and appears in the ContactManager list (FR17, FR19, FR27), **And** `PUT /api/v1/contactos/{id}/cliente` is called with `{ clienteId: uuid }`, **And** queryKeys `['contactos']` and `['contactos', { clienteId }]` are invalidated.

2. **Given** the user creates a new contact from within the ContactManager, **When** the contact is created, **Then** the new contact is automatically associated with the current client (FR18), **And** the contact appears in the ContactManager list immediately.

3. **Given** the user disassociates a contact from the client via ContactManager, **When** the disassociation is confirmed, **Then** the contact is removed from the ContactManager list immediately (FR20, FR27), **And** `PUT /api/v1/contactos/{id}/cliente` is called with `{ clienteId: null }`, **And** the contact record still exists and is accessible from `/contactos`.

## Tasks / Subtasks

- [ ] Task 1 — Backend: Create `AssignContactoClienteCommand` and handler (AC: #1, #3)
  - [ ] Create `backend/src/SiesaAgents.Application/Contactos/Commands/AssignContactoClienteCommand.cs` — record with `Guid ContactoId` and `Guid? ClienteId`
  - [ ] Create `backend/src/SiesaAgents.Application/Contactos/Commands/AssignContactoClienteCommandHandler.cs` — loads contact by id, calls `contacto.AssignCliente(clienteId)`, saves; returns `ContactoDto` or null if not found
  - [ ] Add `AssignCliente(Guid? clienteId)` domain method to `ContactoEntity` — sets `ClienteId = clienteId`, sets `UpdatedAt = DateTimeOffset.UtcNow`

- [ ] Task 2 — Backend: Register `PUT /api/v1/contactos/{id}/cliente` endpoint (AC: #1, #3)
  - [ ] Add `MapPut("/{id:guid}/cliente", ...)` handler to `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`
  - [ ] Create `backend/src/SiesaAgents.Application/Contactos/DTOs/AssignContactoClienteRequest.cs` — record with `Guid? ClienteId` (nullable — null means disassociate)
  - [ ] Create `backend/src/SiesaAgents.Application/Contactos/Validators/AssignContactoClienteRequestValidator.cs` — no validation rules needed beyond null-or-valid-guid (FluentValidation)
  - [ ] Endpoint returns 200 OK + `ContactoDto` on success; 404 Problem Details if contact not found
  - [ ] Register `AssignContactoClienteCommandHandler` in DI in `Program.cs`

- [ ] Task 3 — Frontend: Application layer — `useAssignContactoCliente` mutation hook (AC: #1, #3)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useAssignContactoCliente.ts` — TanStack Query `useMutation` hook; `mutationFn` calls `contactoApiRepository.assignCliente(contactoId, clienteId)` (clienteId: string | null); `onSuccess` invalidates `['contactos']` and `['contactos', { clienteId }]`; shows Spanish toast on error
  - [ ] Extend `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — add `assignCliente(contactoId: string, clienteId: string | null): Promise<Contacto>`
  - [ ] Extend `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — implement `assignCliente` with `PUT /api/v1/contactos/{id}/cliente` via `apiClient`

- [ ] Task 4 — Frontend: Application layer — `useCreateContactoForCliente` mutation hook (AC: #2)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useCreateContactoForCliente.ts` — wraps existing create flow, passes `clienteId` in the request body; `onSuccess` invalidates `['contactos']` and `['contactos', { clienteId }]`
  - [ ] Reuse `contactoApiRepository.create(request)` — request already accepts optional `clienteId` (added in Story 4.1 ATDD fix)

- [ ] Task 5 — Frontend: Presentation layer — extend `ContactManager` with add and remove actions (AC: #1, #2, #3)
  - [ ] Extend `frontend/src/modules/crm/shared/components/ContactManager.tsx` — add `onAddContact?: (contactoId: string) => Promise<void>`, `onRemoveContact?: (contactoId: string) => Promise<void>`, `onCreateContact?: (data: ContactoFormData) => Promise<void>` props
  - [ ] Add "Asociar contacto existente" button (opens a search/select dialog) and "Crear nuevo contacto" button to `ContactManager` header
  - [ ] Add disassociate button (trash/unlink icon) to each contact item row; show confirmation before calling `onRemoveContact`
  - [ ] All buttons and dialogs must use Spanish labels; all user-facing text in Spanish
  - [ ] Create `frontend/src/modules/crm/shared/components/ContactSearchDialog.tsx` — modal dialog with a text input that filters contacts from `['contactos']` query; lists only contacts with `clienteId === null` (orphan) or already associated to this client (to avoid confusion); confirms selection

- [ ] Task 6 — Frontend: Wire mutation hooks into `ClienteDetailView` (AC: #1, #2, #3)
  - [ ] Modify `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — instantiate `useAssignContactoCliente` and `useCreateContactoForCliente` hooks; pass `onAddContact`, `onRemoveContact`, and `onCreateContact` callbacks down to `ContactManager`
  - [ ] `onAddContact` callback: calls `assignContactoCliente({ contactoId, clienteId })` mutation; on success shows toast "Contacto asociado correctamente"
  - [ ] `onRemoveContact` callback: calls `assignContactoCliente({ contactoId, clienteId: null })` mutation; on success shows toast "Contacto desasociado correctamente"
  - [ ] `onCreateContact` callback: calls `createContactoForCliente({ ...data, clienteId })` mutation; on success shows toast "Contacto creado y asociado correctamente"

- [ ] Task 7 — Tests (AC: #1, #2, #3)
  - [ ] **Backend unit — P1**: `AssignContactoClienteCommandHandler` with existing contacto + valid clienteId → sets `ClienteId`, saves, returns `ContactoDto` with new `clienteId` (xUnit)
  - [ ] **Backend unit — P1**: `AssignContactoClienteCommandHandler` with `clienteId = null` → sets `ClienteId` to null, saves, returns `ContactoDto` with `clienteId: null` (xUnit)
  - [ ] **Backend unit — P1**: `AssignContactoClienteCommandHandler` with non-existent contactoId → returns null (xUnit)
  - [ ] **Backend API — P0**: `PUT /api/v1/contactos/{id}/cliente` with `{ clienteId: uuid }` → 200 OK + ContactoDto with updated clienteId (xUnit integration)
  - [ ] **Backend API — P1**: `PUT /api/v1/contactos/{id}/cliente` with `{ clienteId: null }` → 200 OK + ContactoDto with `clienteId: null` (xUnit integration)
  - [ ] **Backend API — P1**: `PUT /api/v1/contactos/{id}/cliente` with non-existent id → 404 Problem Details (xUnit integration)
  - [ ] **Frontend hook — P1**: `useAssignContactoCliente` on success invalidates `['contactos']` and `['contactos', { clienteId }]` (Vitest + MSW)
  - [ ] **Frontend component — P1**: `ContactManager` with `onAddContact` prop renders "Asociar contacto" button; clicking opens search dialog (Vitest + RTL)
  - [ ] **Frontend component — P1**: `ContactManager` with `onRemoveContact` prop renders disassociate button on each contact item (Vitest + RTL)
  - [ ] **Frontend component — P1**: `ClienteDetailView` calls `PUT /api/v1/contactos/{id}/cliente` after user confirms add via dialog; contact appears in list (Vitest + RTL + MSW)

## Dev Notes

### Architecture Context

Story 4.2 builds directly on Story 4.1's read-only `ContactManager` + `ClienteContactServiceAdapter` foundation. This story activates the mutation stubs (`addContact`, `removeContact`) that were left as `throw new Error('Not implemented — Story 4.2')`.

**Component flow (mutations):**

```
ClienteDetailView
  └── useAssignContactoCliente (TanStack Query useMutation)
  └── useCreateContactoForCliente (TanStack Query useMutation)
  └── ContactManager (extended with action props)
        ├── ContactSearchDialog (new — search existing contacts)
        └── ContactoForm (reuse from Epic 3) or inline form
```

**Scope boundary (CRITICAL):**
- Story 4.2 covers: associate existing contact to client, disassociate contact from client, create new contact pre-linked to client.
- Navigation from a contact item to `/contactos/:contactoId` is Story 4.3 scope — do NOT implement here.
- The "Asociar contacto existente" dialog must only show contacts not yet linked to another client (i.e. `clienteId === null`) to avoid accidental reassignment. Reassignment is Story 4.6 scope.

**Invalidation pattern (CRITICAL — from `architecture.md#State Boundaries`):**
Both `['contactos']` (full list) AND `['contactos', { clienteId }]` (client-scoped list) MUST be invalidated after every mutation. Missing either invalidation breaks the story's real-time requirement (FR27).

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['contactos'] });
  queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId }] });
}
```

### Backend: `PUT /api/v1/contactos/{id}/cliente` endpoint

New endpoint on the existing `ContactoEndpoints` group. Uses the CQRS `AssignContactoClienteCommand`:

```csharp
// backend/src/SiesaAgents.Application/Contactos/DTOs/AssignContactoClienteRequest.cs
namespace SiesaAgents.Application.Contactos.DTOs;

public record AssignContactoClienteRequest(Guid? ClienteId);
```

```csharp
// backend/src/SiesaAgents.Application/Contactos/Commands/AssignContactoClienteCommand.cs
namespace SiesaAgents.Application.Contactos.Commands;

public record AssignContactoClienteCommand(Guid ContactoId, Guid? ClienteId);
```

```csharp
// backend/src/SiesaAgents.Application/Contactos/Commands/AssignContactoClienteCommandHandler.cs
public class AssignContactoClienteCommandHandler
{
    private readonly IContactoRepository _repo;
    public AssignContactoClienteCommandHandler(IContactoRepository repo) => _repo = repo;

    public async Task<ContactoDto?> HandleAsync(AssignContactoClienteCommand cmd, CancellationToken ct)
    {
        var contacto = await _repo.GetByIdAsync(cmd.ContactoId, ct);
        if (contacto is null) return null;
        contacto.AssignCliente(cmd.ClienteId);
        await _repo.SaveChangesAsync(ct);
        return new ContactoDto(
            contacto.Id, contacto.Nombre, contacto.Cargo, contacto.Telefono,
            contacto.Email, contacto.ClienteId, contacto.CreatedAt, contacto.UpdatedAt);
    }
}
```

Domain method to add to `ContactoEntity`:

```csharp
// backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs
public void AssignCliente(Guid? clienteId)
{
    ClienteId = clienteId;
    UpdatedAt = DateTimeOffset.UtcNow;
}
```

Endpoint registration in `ContactoEndpoints.cs`:

```csharp
group.MapPut("/{id:guid}/cliente", async (
    Guid id,
    AssignContactoClienteRequest request,
    AssignContactoClienteCommandHandler handler,
    CancellationToken ct) =>
{
    var dto = await handler.HandleAsync(new AssignContactoClienteCommand(id, request.ClienteId), ct);
    if (dto is null)
        return Results.Problem(
            detail: "El contacto solicitado no fue encontrado.",
            statusCode: 404,
            title: "Contacto no encontrado");
    return Results.Ok(dto);
});
```

Response shape — success (200 OK):
```json
{ "id": "uuid", "nombre": "Ana García", "cargo": "Directora", "telefono": "3001234567", "email": "ana@example.com", "clienteId": "uuid-cliente-or-null", "createdAt": "...", "updatedAt": "..." }
```

DI registration in `Program.cs` — add alongside existing command handler registrations:
```csharp
builder.Services.AddScoped<AssignContactoClienteCommandHandler>();
```

### Frontend: `useAssignContactoCliente` Hook

```typescript
// frontend/src/modules/crm/contactos/application/useAssignContactoCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactoApiRepository } from '../infrastructure/contactoApiRepository';
import { toast } from 'sonner';

export const useAssignContactoCliente = (clienteId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactoId, newClienteId }: { contactoId: string; newClienteId: string | null }) =>
      contactoApiRepository.assignCliente(contactoId, newClienteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      if (clienteId) {
        queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId }] });
      }
    },
    onError: () => toast.error('No se pudo actualizar la asociación. Intenta de nuevo.'),
  });
};
```

### Frontend: `contactoApiRepository` Extension

```typescript
// ADD to frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts
assignCliente: async (contactoId: string, clienteId: string | null): Promise<Contacto> => {
  const response = await apiClient.put<Contacto>(`/api/v1/contactos/${contactoId}/cliente`, {
    clienteId,
  });
  return response.data;
},
```

### Frontend: `ContactManager` Props Extension

The existing `ContactManager` accepts `contactos`, `isLoading`, `isError`, `onRetry`. Add optional mutation props:

```typescript
// frontend/src/modules/crm/shared/components/ContactManager.tsx — updated interface
interface ContactManagerProps {
  contactos: Contacto[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onAddContact?: (contactoId: string) => Promise<void>;
  onRemoveContact?: (contactoId: string) => Promise<void>;
  onCreateContact?: (data: { nombre: string; cargo: string; telefono: string; email: string }) => Promise<void>;
  clienteId?: string; // needed to filter search dialog results
}
```

All three action props are optional — `ContactManager` renders read-only when they are absent (backward-compatible with Story 4.1 behavior). The `ContactSearchDialog` is only rendered when `onAddContact` is provided.

### Frontend: `ContactSearchDialog` Component

New component at `frontend/src/modules/crm/shared/components/ContactSearchDialog.tsx`. Uses shadcn/ui `Dialog` (already installed via `npx shadcn@latest add dialog` in Story 1.1):

```typescript
// ContactSearchDialog props
interface ContactSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (contactoId: string) => void;
  currentClienteId: string;
}
```

Internally, it fetches all orphan contacts using `GET /api/v1/contactos` (no filter — then client-side filters to `clienteId === null`). Reuses the `useContactos` hook already available from Epic 3.

### Frontend: Wire into `ClienteDetailView`

```typescript
// Additions in ClienteDetailView.tsx
const assignMutation = useAssignContactoCliente(clienteId);
const createMutation = useCreateContactoForCliente(clienteId);

const handleAddContact = async (contactoId: string) => {
  if (!clienteId) return;
  await assignMutation.mutateAsync({ contactoId, newClienteId: clienteId });
  toast.success('Contacto asociado correctamente');
};

const handleRemoveContact = async (contactoId: string) => {
  await assignMutation.mutateAsync({ contactoId, newClienteId: null });
  toast.success('Contacto desasociado correctamente');
};

const handleCreateContact = async (data: ContactoFormData) => {
  if (!clienteId) return;
  await createMutation.mutateAsync({ ...data, clienteId });
  toast.success('Contacto creado y asociado correctamente');
};
```

Pass these callbacks to `ContactManager`:
```tsx
<ContactManager
  contactos={contactos ?? []}
  isLoading={isLoadingContactos}
  isError={isErrorContactos}
  onRetry={() => refetchContactos()}
  onAddContact={clienteId ? handleAddContact : undefined}
  onRemoveContact={clienteId ? handleRemoveContact : undefined}
  onCreateContact={clienteId ? handleCreateContact : undefined}
  clienteId={clienteId}
/>
```

### TanStack Query Key Alignment

Per `architecture.md#State Boundaries`:
```typescript
['contactos']                       // All contacts — invalidate after every association mutation
['contactos', { clienteId }]        // Contacts for a specific client — invalidate after every mutation
['contactos', id]                   // Single contact — NOT invalidated here (Story 4.2 scope does not affect single-contact view)
```

Both `['contactos']` and `['contactos', { clienteId }]` MUST be invalidated after every `PUT /api/v1/contactos/{id}/cliente` call to fulfill FR27 (changes visible immediately to all users).

### Project Structure Notes

**Files to create:**
```
frontend/
└── src/
    ├── modules/crm/
    │   ├── contactos/
    │   │   ├── domain/IContactoRepository.ts                      ← MODIFY (add assignCliente)
    │   │   ├── application/useAssignContactoCliente.ts            ← CREATE
    │   │   ├── application/useCreateContactoForCliente.ts         ← CREATE
    │   │   └── infrastructure/contactoApiRepository.ts            ← MODIFY (add assignCliente)
    │   └── clientes/
    │       ├── presentation/
    │       │   └── ClienteDetailView.tsx                          ← MODIFY (wire mutation hooks + callbacks)
    │       └── application/
    │           └── (no new files — mutations live in contactos domain)
    └── shared/components/
        ├── ContactManager.tsx                                      ← MODIFY (add action props)
        └── ContactSearchDialog.tsx                                 ← CREATE

backend/
└── src/
    ├── SiesaAgents.Domain/
    │   └── Contactos/Entities/
    │       └── ContactoEntity.cs                                   ← MODIFY (add AssignCliente method)
    ├── SiesaAgents.Application/
    │   └── Contactos/
    │       ├── Commands/
    │       │   ├── AssignContactoClienteCommand.cs                 ← CREATE
    │       │   └── AssignContactoClienteCommandHandler.cs          ← CREATE
    │       ├── DTOs/
    │       │   └── AssignContactoClienteRequest.cs                 ← CREATE
    │       └── Validators/
    │           └── AssignContactoClienteRequestValidator.cs        ← CREATE (optional — request is minimal)
    └── SiesaAgents.API/
        ├── Endpoints/
        │   └── ContactoEndpoints.cs                                ← MODIFY (add PUT /{id}/cliente handler)
        └── Program.cs                                              ← MODIFY (register AssignContactoClienteCommandHandler)

tests/
└── (Backend) AssignContactoClienteTests.cs                        ← CREATE (unit + integration xUnit)
```

**Files NOT to modify:**
- `GetContactosQuery.cs` / `GetContactosQueryHandler.cs` — Story 4.1 already handles `clienteId` filter; no changes needed
- `ContactoDto.cs` — already contains `Guid? ClienteId`; no changes needed
- `contactos.$contactoId.tsx` route — Story 4.3 scope (navigation from ContactManager)

### Enforcement Checklist (Must Verify Before Marking Done)

- [ ] `PUT /api/v1/contactos/{id}/cliente` with `{ clienteId: uuid }` → 200 OK + ContactoDto with new `clienteId`
- [ ] `PUT /api/v1/contactos/{id}/cliente` with `{ clienteId: null }` → 200 OK + ContactoDto with `clienteId: null` (contact remains in DB)
- [ ] `PUT /api/v1/contactos/{id}/cliente` with non-existent id → 404 Problem Details RFC 7807
- [ ] Both `['contactos']` and `['contactos', { clienteId }]` are invalidated after every mutation
- [ ] `ContactManager` retains read-only behavior when action props are absent (backward-compatible)
- [ ] `ContactSearchDialog` only shows orphan contacts (`clienteId === null`) to prevent accidental reassignment (Story 4.6 scope)
- [ ] All user-facing text in Spanish: "Asociar contacto existente", "Crear nuevo contacto", "Desasociar", toast messages, dialog labels
- [ ] No `any` type in TypeScript — strict mode enforced
- [ ] `DateTimeOffset.UtcNow` used in `AssignCliente` domain method for `UpdatedAt`
- [ ] `AssignContactoClienteCommandHandler` registered in DI in `Program.cs`
- [ ] `ClienteContactServiceAdapter.addContact` and `removeContact` stubs replaced with actual implementation (or delegate to the hooks in `ClienteDetailView`)

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md#Story 4.2`]
- Architecture — `PUT /api/v1/contactos/{id}/cliente` endpoint contract: [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Architecture — TanStack Query canonical keys + mandatory invalidation: [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- Architecture — mutation invalidation pattern template: [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- Architecture — FR17 (associate), FR18 (create+associate), FR19 (link), FR20 (unlink), FR27 (immediate visibility): [Source: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md#Acceptance Criteria (QA Validation)`]
- Preceding story — ContactManager custom component + ClienteContactServiceAdapter stubs: [Source: `_bmad-output/implementation-artifacts/4-1-view-associated-contacts-in-client-detail.md#Completion Notes List`]
- Preceding story — useContactosByCliente queryKey canonical form: [Source: `_bmad-output/implementation-artifacts/4-1-view-associated-contacts-in-client-detail.md#TanStack Query Key Alignment`]
- Preceding story — ClienteDetailView current structure (useContactosByCliente hook, ContactManager props): [Source: `_bmad-output/implementation-artifacts/4-1-view-associated-contacts-in-client-detail.md#Frontend: ClienteDetailView — Integration Point`]
- Preceding story — contactoApiRepository singleton export pattern: [Source: `_bmad-output/implementation-artifacts/3-1-contact-list-search.md`]
- Preceding story — POST /contactos accepts clienteId (ATDD fix, Story 4.1): [Source: `_bmad-output/implementation-artifacts/4-1-view-associated-contacts-in-client-detail.md#Completion Notes List`]
- Company standards — TypeScript strict, TanStack Query, useMutation pattern: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack`]
- Company standards — CQRS pattern (Commands separated from Queries): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`]
- Company standards — Problem Details RFC 7807 error format: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`]
- Company standards — DateTimeOffset mandatory (never DateTime): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
