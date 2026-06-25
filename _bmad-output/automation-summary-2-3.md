# Automation Summary — Story 2.3: Create Client

**Date:** 2026-06-25
**Story:** 2.3 — Create Client
**Mode:** BMad-Integrated
**Coverage Target:** critical-paths + edge cases

---

## Tests Created (Expansion Files)

### E2E Tests — 8 new tests

**File:** `e2e/story-2-3/create-client-edge-cases.spec.ts`

- [P1] should keep the URL at /clientes after a successful form submission
- [P1] should show a clean empty form when "Nuevo cliente" is clicked after a successful create
- [P1] should preserve the NIT field value after a 5xx server error
- [P1] should preserve the Ciudad field value after a 5xx server error
- [P1] should display "Guardando…" text on the submit button while the mutation is in flight
- [P1] should clear the NIT inline error when user corrects the NIT and submits successfully
- [P2] should submit the form when Enter is pressed while a field is focused
- [P1] should close the form even when all fields are filled when Cancelar is clicked

### API Tests — 21 new tests

**File:** `e2e/story-2-3/clientes-create-api-edge-cases.spec.ts`

- [P1] 4x Whitespace-only fields return 400 (nombre, nit, telefono, ciudad)
- [P1] 5x Max-length boundary: exact 200 chars = 201 (valid + invalid per field)
- [P1] Empty JSON object {} returns 400
- [P1] Wrong Content-Type returns 415
- [P1] 400 response body includes status=400 (Problem Details structure)
- [P1] 400 body returns errors for all four empty fields
- [P1] 400 response does NOT expose stack trace (NFR6)
- [P1] 409 response Content-Type is application/problem+json
- [P1] 409 body includes status=409
- [P1] 409 body includes non-empty title
- [P1] 201 createdAt is UTC ISO timestamp
- [P1] 201 updatedAt is UTC ISO timestamp
- [P2] 201 createdAt and updatedAt are equal on initial creation
- [P1] Location header resolves to accessible GET resource

### Frontend Unit Tests (Zod schema) — 21 new tests

**File:** `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts`

- [P1] 2x Happy path: valid object parses with all fields
- [P1] 4x min(1) boundary: single char accepted per field
- [P1] 4x Empty string error messages match story spec ("El nombre es requerido", etc.)
- [P1] 8x max(200) boundary: exact 200 and 201 chars per field
- [P2] 1x Whitespace-only behavior documented (Zod passes, backend NotEmpty() rejects)
- [P1] 2x Missing fields: individual field missing + empty object fails all four

### Frontend Unit Tests (useCreateCliente hook) — 9 new tests

**File:** `frontend/src/modules/crm/clientes/application/useCreateCliente.edge-cases.test.ts`

- [P1] isIdle=true before mutation is triggered
- [P1] isPending=false before mutation is triggered
- [P1] data=undefined before mutation is triggered
- [P1] Returns created ClienteDto in data on success
- [P1] isError=true on 500 Internal Server Error
- [P1] isError=true on 503 Service Unavailable
- [P1] invalidateQueries NOT called on 409 failure
- [P1] invalidateQueries NOT called on 500 failure
- [P1] Mutation succeeds on second call after first failed call

### Frontend Component Tests (ClienteForm) — 18 new tests

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.edge-cases.test.tsx`

- [P1] form with data-testid="cliente-form" is in DOM
- [P1] aria-invalid=false on nombre input before submission
- [P1] aria-invalid=false on nit input before submission
- [P1] submit button has aria-label "Guardar nuevo cliente" when not pending
- [P1] aria-invalid=true on nit input after 409 conflict
- [P1] aria-describedby set on nit input after 409 conflict
- [P1] NIT value preserved after 500 server error
- [P1] Teléfono value preserved after 500 server error
- [P1] Ciudad value preserved after 500 server error
- [P1] onNotify called with "success" message on successful submit
- [P1] onNotify called with "error" message on 5xx response
- [P1] onNotify NOT called on 409 (inline only)
- [P1] Cancelar does not show validation errors
- [P1] 4x error elements have correct data-testid per field
- [P1] 400 from server shows generic toast error (not inline)

### Backend Unit Tests (C# edge cases) — 12 [Fact] + 9 [InlineData] = ~21 test cases

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerEdgeCaseTests.cs`

**Handler edge cases:**
- GeneratesNewGuidId_NotEmpty (two calls produce different GUIDs)
- ReturnsCreatedAtAndUpdatedAtAsUtc (DateTimeOffset.Offset == 0)
- CreatedAtAndUpdatedAt_AreEqualOnCreate
- MapsAllFieldsCorrectly_ToClienteDto
- CanCreateMultipleClients_WithDifferentNits

**Validator edge cases:**
- WhitespaceOnly on all four fields → validation error (4 facts)
- NombreAtExactMaxLength(200) → valid [Theory]
- NombreExceedingMaxLength(201, 300) → error [Theory]
- NitExceedingMaxLength(201, 300) → error [Theory]
- TelefonoExceedingMaxLength(201, 300) → error [Theory]
- CiudadExceedingMaxLength(201, 300) → error [Theory]
- AllFieldsEmpty → 4 field errors
- SingleCharacterInAllFields → valid
- AllFieldsAtExactMaxLength(200) → valid

---

## Coverage Analysis

### Total New Tests: 77 across 5 new files
- E2E: 8 tests (P1: 7, P2: 1)
- API: 21 tests (P1: 18, P2: 3)
- Unit/Schema: 21 tests (P1: 20, P2: 1)
- Unit/Hook: 9 tests (P1: 9)
- Component: 18 tests (P1: 18)
- Backend Unit (C#): ~21 test cases (P1: 21)

### Tests Marked as fixme: 0

### Coverage Gaps Now Addressed
- ✅ URL stability after create (no navigation side effects)
- ✅ Form reset state after re-open
- ✅ All field data preserved on 5xx (not just Nombre)
- ✅ "Guardando…" text (not just disabled state)
- ✅ NIT error clears on successful correction
- ✅ Keyboard Enter submits form
- ✅ Whitespace-only validation at both frontend (Zod behavior documented) and backend (FluentValidation NotEmpty)
- ✅ Max-length exact boundary: 200 = valid, 201 = invalid at API and validator levels
- ✅ Missing body / wrong Content-Type at API level
- ✅ 400 and 409 Problem Details structure completeness
- ✅ UTC timestamp format guarantee (Z suffix)
- ✅ Location header resolution to actual resource
- ✅ ARIA attributes: aria-invalid and aria-describedby
- ✅ invalidateQueries not triggered on failure
- ✅ Mutation re-trigger after failure (stateless mutation)
- ✅ onNotify optional callback fires correctly
- ✅ Backend: DateTimeOffset UTC offset and equal timestamps on create
- ✅ Backend: whitespace rejects via FluentValidation NotEmpty

### Definition of Done
- [x] All tests follow Given-When-Then format
- [x] All E2E tests use data-testid selectors
- [x] All tests have priority tags [P0], [P1], [P2]
- [x] E2E tests use network-first route interception
- [x] No hard waits (setTimeout) in E2E tests
- [x] No duplicate coverage with ATDD tests (complementary edge cases only)
- [x] Backend tests use file-scoped fake repositories (isolated)
- [x] Frontend tests use MSW with per-test server.use() overrides
- [x] 0 tests marked test.fixme()

## Pre-existing ATDD Tests (not modified)
- `e2e/story-2-3/create-client.spec.ts` — 23 tests (6 ACs)
- `e2e/story-2-3/clientes-create.api.spec.ts` — 17 tests (API contract)
- `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts` — 3 tests
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx` — 7 tests
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs` — 7 tests

**Combined total (ATDD + expansion): ~134 tests for Story 2.3**

---

## Test Execution

```bash
# Run all Story 2.3 E2E tests
npx playwright test e2e/story-2-3/

# Run only edge case E2E tests
npx playwright test e2e/story-2-3/create-client-edge-cases.spec.ts

# Run API edge case tests
npx playwright test e2e/story-2-3/clientes-create-api-edge-cases.spec.ts

# Run all frontend unit/component tests for clientes
npx vitest run frontend/src/modules/crm/clientes/

# Run only schema tests
npx vitest run frontend/src/modules/crm/clientes/application/clienteSchema.test.ts

# Run backend edge case unit tests
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "CreateClienteCommandHandlerEdgeCaseTests"
```
