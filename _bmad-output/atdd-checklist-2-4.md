# ATDD Checklist - Epic 2, Story 2.4: Edit Client

**Date:** 2026-06-29
**Author:** SiesaTeam
**Primary Test Level:** Component + Unit + API Integration

---

## Story Summary

A commercial team member wants to edit any field of an existing client so that client
information stays up to date. The system displays a pre-filled form, validates input
client-side, submits a PUT to the backend, invalidates both list and detail caches,
and shows a success toast.

**As a** commercial team member
**I want** to edit any field of an existing client
**So that** the client information stays up to date

---

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** the user clicks "Editar", **Then** the client form opens pre-filled with all current values (Nombre, NIT/RUC, Teléfono, Ciudad).
2. **Given** the user modifies one or more fields and submits, **When** the form is saved, **Then** changes are reflected immediately in list and detail **And** toast "Cliente actualizado correctamente" appears.
3. **Given** the user clears a required field and submits, **When** the form is validated, **Then** an inline error appears on the cleared field and the form is NOT submitted to the backend.
4. **Given** the user clicks "Cancelar" without saving, **When** the form closes, **Then** original client data remains unchanged and no PUT request is triggered.
5. **Given** the form submits successfully, **When** the mutation's `onSuccess` fires, **Then** `queryClient.invalidateQueries({ queryKey: ['clientes'] })` AND `queryClient.invalidateQueries({ queryKey: ['clientes', id] })` are both called.

---

## Failing Tests Created (RED Phase)

### Unit Tests — useUpdateCliente hook (8 tests)

**File:** `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts`

- **Test:** TC-E2-P2-05-UPDATE: invalidateQueries(['clientes']) called after successful PUT
  - **Status:** RED — Module `./useUpdateCliente` does not exist yet
  - **Verifies:** AC #5 — list cache invalidation on PUT onSuccess

- **Test:** TC-E2-P2-05-UPDATE: invalidateQueries(['clientes', id]) called after successful PUT
  - **Status:** RED — Module `./useUpdateCliente` does not exist yet
  - **Verifies:** AC #5 — detail cache invalidation on PUT onSuccess

- **Test:** invalidateQueries NOT called when PUT mutation fails
  - **Status:** RED — Module not found
  - **Verifies:** Cache only invalidated on success, not on error

- **Test:** isPending is true while PUT mutation is in flight
  - **Status:** RED — Module not found
  - **Verifies:** AC #2 — button disabled state during pending

- **Test:** isPending is false before any mutation is triggered
  - **Status:** RED — Module not found
  - **Verifies:** Initial idle state

- **Test:** options.onSuccess called when PUT mutation succeeds
  - **Status:** RED — Module not found
  - **Verifies:** AC #2 — onSuccess prop callback invoked

- **Test:** options.onSuccess NOT called when PUT mutation fails
  - **Status:** RED — Module not found
  - **Verifies:** onSuccess not triggered on error

- **Test:** isError exposed when backend returns 500
  - **Status:** RED — Module not found
  - **Verifies:** Error state properly exposed

### Component Tests — ClienteForm edit mode (11 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx`

- **Test:** TC-E2-P1-07: Nombre input pre-filled with existing client nombre
  - **Status:** RED — ClienteForm does not accept `mode` or `cliente` props yet
  - **Verifies:** AC #1 — form pre-fill (Nombre)

- **Test:** TC-E2-P1-07: NIT input pre-filled with existing client nit
  - **Status:** RED — ClienteForm props not yet extended
  - **Verifies:** AC #1 — form pre-fill (NIT)

- **Test:** TC-E2-P1-07: Teléfono input pre-filled with existing client telefono
  - **Status:** RED — ClienteForm props not yet extended
  - **Verifies:** AC #1 — form pre-fill (Teléfono)

- **Test:** TC-E2-P1-07: Ciudad input pre-filled with existing client ciudad
  - **Status:** RED — ClienteForm props not yet extended
  - **Verifies:** AC #1 — form pre-fill (Ciudad)

- **Test:** TC-E2-P1-07: All 4 inputs pre-filled simultaneously
  - **Status:** RED — ClienteForm props not yet extended
  - **Verifies:** AC #1 — all fields pre-filled at once

- **Test:** TC-E2-P1-08: onCancel called when Cancelar is clicked
  - **Status:** RED — ClienteForm does not support edit mode
  - **Verifies:** AC #4 — cancel without saving

- **Test:** TC-E2-P1-08: PUT NOT sent when Cancelar is clicked
  - **Status:** RED — ClienteForm does not support edit mode
  - **Verifies:** AC #4 — no PUT on cancel

- **Test:** TC-E2-P1-09: PUT body contains updated ciudad
  - **Status:** RED — ClienteForm does not call useUpdateCliente yet
  - **Verifies:** AC #2 — correct PUT payload

- **Test:** TC-E2-P1-09: onSuccess called after successful PUT
  - **Status:** RED — ClienteForm does not call useUpdateCliente yet
  - **Verifies:** AC #2 — onSuccess invoked after save

- **Test:** TC-E2-P1-09: Toast "Cliente actualizado correctamente" shown after PUT
  - **Status:** RED — toast not shown in edit mode yet
  - **Verifies:** AC #2 — success toast message

- **Test:** TC-E2-P2-02: Inline error on Nombre when cleared and submitted
  - **Status:** RED — ClienteForm does not support edit mode
  - **Verifies:** AC #3 — validation blocks submit on cleared field

- **Test:** TC-E2-P2-02: PUT NOT sent when Nombre is cleared
  - **Status:** RED — ClienteForm does not support edit mode
  - **Verifies:** AC #3 — form not submitted to backend

- **Test:** TC-E2-P2-02: PUT NOT sent when NIT is cleared
  - **Status:** RED — ClienteForm does not support edit mode
  - **Verifies:** AC #3 — validation on any required field

- **Test:** Guardar button disabled while PUT mutation in flight
  - **Status:** RED — edit mode isPending not wired
  - **Verifies:** double-submit prevention

### API Integration Tests — PUT /api/v1/clientes/{id} (5 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/UpdateClienteEndpointTests.cs`

- **Test:** TC-E2-P1-18: PUT valid payload → 200 OK with updated ClienteDto and updatedAt
  - **Status:** RED — PUT endpoint not registered in ClientesEndpoints.cs
  - **Verifies:** AC #2 — 200 response with full updated dto + updatedAt ISO 8601 with TZ

- **Test:** TC-E2-P1-18 variant: GET after PUT confirms persistence
  - **Status:** RED — endpoint not registered
  - **Verifies:** AC #2 (FR27) — changes persisted and retrievable

- **Test:** TC-E2-P1-18 variant: PUT updates nombre correctly
  - **Status:** RED — endpoint not registered
  - **Verifies:** AC #2 — any field update works

- **Test:** Update 404: PUT to non-existent ID → 404 Problem Details, no stackTrace
  - **Status:** RED — endpoint not registered, NotFoundException not mapped
  - **Verifies:** 404 for non-existent client (NFR6 no stackTrace)

- **Test:** Validation 400: PUT empty body → 400 Problem Details with field errors
  - **Status:** RED — endpoint not registered, validator not created
  - **Verifies:** AC #3 (backend) — 400 with field-level errors, no stackTrace

- **Test:** Validation 400 partial: PUT with missing fields → 400
  - **Status:** RED — endpoint/validator not implemented
  - **Verifies:** FluentValidation rejects partial update payload

---

## Data Infrastructure

### MSW Handler File (NEW)

**File:** `frontend/src/test/msw/handlers/clientes-update.handlers.ts`

**Exports:**
- `handlePutClienteSuccess(responseOverrides?)` — Returns 200 OK with updated ClienteDto
- `handlePutClienteNotFound()` — Returns 404 Problem Details
- `handlePutClienteValidationError()` — Returns 400 Problem Details with field errors
- `handlePutClienteServerError()` — Returns 500 Internal Server Error

### Client Factory (Reused)

**File:** `frontend/src/test/factories/cliente.factory.ts` (already exists from Story 2.1)

No changes needed — `createCliente(overrides)` and `createClientes(count)` are already available.

---

## Required data-testid Attributes

### ClienteForm (new attributes for edit mode — same testids as create mode)

These testids already exist from Story 2.3 and must remain consistent:
- `cliente-form-nombre` — Nombre input field (pre-filled in edit mode)
- `cliente-form-nit` — NIT/RUC input field (pre-filled in edit mode)
- `cliente-form-telefono` — Teléfono input field (pre-filled in edit mode)
- `cliente-form-ciudad` — Ciudad input field (pre-filled in edit mode)
- `cliente-form-submit` — "Guardar" button (disabled while isPending)
- `cliente-form-cancel` — "Cancelar" button
- `cliente-form-error-nombre` — Inline error for Nombre field
- `cliente-form-error-nit` — Inline error for NIT field
- `cliente-form-error-telefono` — Inline error for Teléfono field
- `cliente-form-error-ciudad` — Inline error for Ciudad field

### ClienteDetailView (NEW for Story 2.4)

- `cliente-detail-edit-button` — "Editar" button that opens the edit form

---

## Mock Requirements

### PUT /api/v1/clientes/:id — MSW handler for frontend tests

**File:** `frontend/src/test/msw/handlers/clientes-update.handlers.ts` (created as part of ATDD)

**Success (200):** Returns ClienteDto with updated fields and `updatedAt: '2026-06-29T10:00:00Z'`
**Not Found (404):** Problem Details `{ status: 404, title: 'Not Found', detail: 'Cliente no encontrado' }`
**Error (500):** `{ status: 500, title: 'Internal Server Error' }`

---

## Implementation Checklist

### Test: TC-E2-P1-07 (pre-fill) + TC-E2-P1-08 (cancel) + TC-E2-P2-02 (validation)

**Tasks to make component tests pass:**

- [ ] Update `ClienteForm.tsx`: add optional props `cliente?: Cliente` and `mode?: 'create' | 'edit'`
- [ ] When `mode === 'edit'` and `cliente` provided: pass `defaultValues` to `useForm` from cliente fields
- [ ] Cancel button calls `onCancel()` without triggering any mutation (already works in create mode — verify edit mode does same)
- [ ] Add `data-testid` attributes: `cliente-form-nombre`, `cliente-form-nit`, `cliente-form-telefono`, `cliente-form-ciudad`, `cliente-form-submit`, `cliente-form-cancel`, `cliente-form-error-*` (already present from Story 2.3 — verify)
- [ ] Run tests: `cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E2-P1-09 (successful submit) + useUpdateCliente tests

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
  - Uses `useMutation` from TanStack Query
  - `mutationFn: ({ id, data }) => clienteApiRepository.update(id, data)` — calls `PUT /api/v1/clientes/{id}`
  - `onSuccess`: calls `queryClient.invalidateQueries({ queryKey: ['clientes'] })` AND `queryClient.invalidateQueries({ queryKey: ['clientes', id] })`
  - `onSuccess`: shows toast "Cliente actualizado correctamente"
  - `onError`: shows generic "Error al actualizar el cliente"
  - Exposes `mutate`, `isPending`, `isError`, `error`
  - Calls `options?.onSuccess?.()` in `onSuccess`
- [ ] Update `IClienteRepository.ts`: add `update(id: string, data: ClienteFormData): Promise<Cliente>`
- [ ] Update `clienteApiRepository.ts`: implement `update` — `apiClient.put<Cliente>(\`/api/v1/clientes/${id}\`, data).then(r => r.data)`
- [ ] Update `ClienteForm.tsx`: when `mode === 'edit'` submit calls `useUpdateCliente.mutate({ id: cliente.id, data })`
- [ ] Run tests: `cd frontend && npx vitest run src/modules/crm/clientes/application/useUpdateCliente.test.ts`
- [ ] Run tests: `cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx`
- [ ] Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: TC-E2-P1-18 + 404 + 400 API integration tests

**Tasks to make backend tests pass:**

- [ ] Add `Update()` method to `ClienteEntity.cs` — sets Nombre, Nit, Telefono, Ciudad, `UpdatedAt = DateTimeOffset.UtcNow`
- [ ] Create `UpdateClienteCommand.cs` — record with `Guid Id, string Nombre, string Nit, string Telefono, string Ciudad`
- [ ] Create `UpdateClienteCommandHandler.cs` — loads entity by ID (404 if not found), calls `entity.Update(...)`, saves via `UpdateAsync`, returns `ClienteDto`
- [ ] Update `IClienteRepository.cs` — add `UpdateAsync(ClienteEntity entity, CancellationToken ct): Task`
- [ ] Update `ClienteRepository.cs` — implement `UpdateAsync`: marks entity Modified, calls `SaveChangesAsync()`
- [ ] Create `UpdateClienteRequest.cs` (DTO) — `string Nombre, Nit, Telefono, Ciudad`
- [ ] Create `UpdateClienteRequestValidator.cs` — FluentValidation: all 4 fields required → 400 on failure
- [ ] Update `ClientesEndpoints.cs` — add `MapPut("/api/v1/clientes/{id}", ...)` returning 200 OK ClienteDto
- [ ] Verify `ExceptionHandlingMiddleware` maps `NotFoundException` → 404 Problem Details (no stackTrace)
- [ ] Run tests: `cd backend && dotnet test tests/SiesaAgents.IntegrationTests --filter "UpdateClienteEndpointTests"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: ClienteDetailView "Editar" button wires edit form (AC #1, #4)

**Tasks (no direct ATDD test in this checklist — covered by E2E if needed):**

- [ ] Update `ClienteDetailView.tsx`: add `useState<boolean>` for `isEditFormOpen`
- [ ] Add "Editar" button with `data-testid="cliente-detail-edit-button"` and `PencilIcon`
- [ ] When `isEditFormOpen`: render `<ClienteForm mode="edit" cliente={currentCliente} onSuccess={() => setIsEditFormOpen(false)} onCancel={() => setIsEditFormOpen(false)} />`
- [ ] When `!isEditFormOpen`: render client detail fields as before

---

## Running Tests

```bash
# Run all Story 2.4 unit tests
cd frontend && npx vitest run src/modules/crm/clientes/application/useUpdateCliente.test.ts

# Run all Story 2.4 component tests
cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx

# Run all frontend Story 2.4 tests together
cd frontend && npx vitest run src/modules/crm/clientes/application/useUpdateCliente.test.ts src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx

# Run Story 2.4 backend API tests
cd backend && dotnet test tests/SiesaAgents.IntegrationTests --filter "UpdateClienteEndpointTests"

# Run all frontend tests (coverage check)
cd frontend && npx vitest run

# Run all backend tests
cd backend && dotnet test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- MSW handlers created for PUT endpoint
- No changes to implementation files
- data-testid requirements listed
- Implementation checklist created

**Verification:**

- `useUpdateCliente.test.ts` — fails: "Cannot find module './useUpdateCliente'"
- `ClienteForm.edit.test.tsx` — fails: ClienteForm does not accept `mode`/`cliente` props
- `UpdateClienteEndpointTests.cs` — fails: PUT endpoint returns 404/405 (not registered)

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with component pre-fill tests)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run test to verify it now passes (green)
5. Check off task in implementation checklist
6. Move to next test and repeat

**Recommended order (dependency chain):**

1. Backend: `ClienteEntity.Update()` method
2. Backend: Repository `UpdateAsync`, Validator, Command, Handler, Endpoint
3. Backend: Run API tests → all 6 pass
4. Frontend: `useUpdateCliente.ts` + `clienteApiRepository.update()`
5. Frontend: Run unit tests → all 8 pass
6. Frontend: `ClienteForm.tsx` edit mode props + defaultValues
7. Frontend: Run component tests → all 14 pass

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Review code for quality (DRY, readability)
3. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase:
   - `cd frontend && npx vitest run src/modules/crm/clientes/application/useUpdateCliente.test.ts`
   - `cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx`
   - `cd backend && dotnet test tests/SiesaAgents.IntegrationTests --filter "UpdateClienteEndpointTests"`
3. Begin implementation using implementation checklist as guide
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor code for quality
6. When refactoring complete, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — MSW handlers registered before navigation/render; PUT handler captures request body before asserting
- **data-factories.md** — `createCliente(overrides)` factory reused for test data seeding
- **component-tdd.md** — Given-When-Then format; React Testing Library with isolated QueryClient per test
- **test-quality.md** — One assertion per test (atomic), explicit `waitFor` instead of hard waits, `onUnhandledRequest: 'error'` to catch unexpected network calls
- **selector-resilience.md** — All selectors use `data-testid` (never CSS class selectors)
- **fixture-architecture.md** — `server.resetHandlers()` + `server.close()` in `afterEach` for test isolation

---

**Generated by BMad TEA Agent** — 2026-06-29
