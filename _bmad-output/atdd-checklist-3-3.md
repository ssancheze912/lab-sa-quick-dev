# ATDD Checklist - Epic 3, Story 3.3: Create Contact

**Date:** 2026-06-28
**Author:** SiesaTeam
**Primary Test Level:** Component (P0) + API (P0/P1) + E2E (P1)

---

## Story Summary

Commercial team members can register a new contact by filling in a form with four required fields
(Nombre, Cargo, Teléfono, Email). On success the contact appears immediately in the contact list
without a page reload (FR27 / R-002) and a toast "Contacto creado correctamente" is shown. Client-side
Zod validation prevents empty submissions, and backend errors (400/409) are surfaced without exposing
technical details (NFR6).

**As a** commercial team member
**I want** to register a new contact by filling in a form
**So that** the contact is available in the system immediately for the whole team

---

## Acceptance Criteria

1. **Given** the user is on `/contactos`, **When** the user clicks "Nuevo contacto", **Then** a form opens with fields: Nombre, Cargo, Teléfono, Email (all required per FR9).

2. **Given** the user fills all required fields and submits, **When** the form is submitted, **Then** the contact is created via `POST /api/v1/contactos`, appears in the contact list immediately without page reload (FR27), **And** a success toast displays "Contacto creado correctamente".

3. **Given** the user submits the form with one or more required fields empty, **When** the form is validated (client-side Zod), **Then** clear inline error messages appear on the empty fields (FR16), **And** the form is NOT submitted to the backend.

4. **Given** the backend returns a validation error (400) or conflict (409), **When** the error is received, **Then** the error message is displayed clearly without exposing technical details (NFR6).

---

## Failing Tests Created (RED Phase)

### E2E Tests (6 tests)

**File:** `e2e/tests/contactos/contactos-create.spec.ts`

- **Test:** `AC-1: should open ContactoForm with four required fields when "Nuevo contacto" is clicked`
  - **Status:** RED — `btn-nuevo-contacto` data-testid not yet implemented in /contactos route
  - **Verifies:** AC-1 / FR9 — form opens with all four required fields

- **Test:** `TC-E3-3-3-E2E-1: should show new contact Nombre in list immediately after creation without page reload`
  - **Status:** RED — ContactoForm and useCreateContacto not yet implemented
  - **Verifies:** AC-2 / FR27 / R-002 — full create journey with invalidateQueries list refresh

- **Test:** `AC-3: should show inline validation errors and NOT call POST when form is submitted empty`
  - **Status:** RED — ContactoForm Zod validation not yet implemented
  - **Verifies:** AC-3 / FR16 — client-side guard prevents backend call on empty submission

- **Test:** `AC-4: should show "El email ya está registrado" inline error on Email field when backend returns 409`
  - **Status:** RED — ContactoForm 409 handling not yet implemented
  - **Verifies:** AC-4 / NFR6 — 409 surfaced as inline Email error without technical details

- **Test:** `should close the form when "Cancelar" button is clicked without creating a contact`
  - **Status:** RED — btn-cancel not yet implemented
  - **Verifies:** Cancel button behavior — form closes, POST never called

- **Test:** `AC-1: should show "Nuevo contacto" button when a contact detail is open (contactos.$contactoId route)`
  - **Status:** RED — btn-nuevo-contacto not yet wired in /contactos/:contactoId route
  - **Verifies:** AC-1 — button available in both /contactos and /contactos/:id routes

### API Tests (6 tests — already exist in backend)

**File:** `backend/tests/SiesaAgents.UnitTests/Contactos/CreateContactoApiTests.cs`

- **Test:** `PostContacto_WithValidPayload_Returns201AndContactoDto`
  - **Status:** RED until endpoint verified — TC-E3-3-3-API-1 (P0)
  - **Verifies:** POST returns 201 + ContactoDto with all fields + DateTimeOffset timestamps

- **Test:** `PostContacto_ThenGetList_NewContactAppearsInList`
  - **Status:** RED until endpoint verified — TC-E3-3-3-API-2 (P0)
  - **Verifies:** Contact immediately available in GET list after POST (FR27)

- **Test:** `PostContacto_WithEmptyBody_Returns400WithProblemDetails`
  - **Status:** RED until validator verified — TC-E3-3-3-API-3 (P1)
  - **Verifies:** Empty body → 400 + Problem Details RFC 7807 with errors object

- **Test:** `PostContacto_WithDuplicateEmail_Returns409Conflict`
  - **Status:** RED until endpoint verified — TC-E3-3-3-API-4 (P1)
  - **Verifies:** Duplicate email → 409 + Problem Details with "email" in detail (R-001 doc)

### Unit Tests (4 tests — already exist in backend)

**File:** `backend/tests/SiesaAgents.UnitTests/Contactos/CreateContactoValidatorTests.cs`

- **Test:** `Validator_WhenNombreIsNull_HasValidationError`
  - **Status:** RED until CreateContactoRequestValidator verified — TC-E3-3-3-UNIT-1 (P2)
  - **Verifies:** Validator rejects null Nombre

- **Test:** `Validator_WhenCargoIsNull_HasValidationError`
  - **Status:** RED until validator verified — TC-E3-3-3-UNIT-2 (P2)
  - **Verifies:** Validator rejects null Cargo

- **Test:** `Validator_WhenTelefonoIsNull_HasValidationError`
  - **Status:** RED until validator verified — TC-E3-3-3-UNIT-3 (P2)
  - **Verifies:** Validator rejects null Telefono

- **Test:** `Validator_WhenEmailIsNull_HasValidationError`
  - **Status:** RED until validator verified — TC-E3-3-3-UNIT-4 (P2)
  - **Verifies:** Validator rejects null Email

### Component Tests (12 tests)

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoForm.test.tsx`

- **Test:** `TC-E3-3-3-CMP-1: should show 4 inline validation errors when all required fields are empty`
  - **Status:** RED — ContactoForm does not exist yet
  - **Verifies:** AC-3 (P0) — 4 alerts on empty submit, POST never called

- **Test:** `should show inline error for Nombre field when empty`
  - **Status:** RED — ContactoForm does not exist yet
  - **Verifies:** Nombre field inline error on empty submit

- **Test:** `should show inline error for Cargo field when empty`
  - **Status:** RED — ContactoForm does not exist yet
  - **Verifies:** Cargo field inline error on empty submit

- **Test:** `should show inline error for Teléfono field when empty`
  - **Status:** RED — ContactoForm does not exist yet
  - **Verifies:** Teléfono field inline error on empty submit

- **Test:** `should show inline error for Email field when empty`
  - **Status:** RED — ContactoForm does not exist yet
  - **Verifies:** Email field inline error on empty submit

- **Test:** `should NOT call POST /api/v1/contactos when client-side validation fails`
  - **Status:** RED — ContactoForm does not exist yet
  - **Verifies:** Zod guard prevents backend call on validation failure

- **Test:** `TC-E3-3-3-CMP-2: should display "El email ya está registrado" as inline error on Email field when backend returns 409`
  - **Status:** RED — ContactoForm does not exist yet
  - **Verifies:** AC-4 (P2) — 409 → inline Email error, NFR6

- **Test:** `should NOT expose technical details in the error message (NFR6)`
  - **Status:** RED — ContactoForm does not exist yet
  - **Verifies:** NFR6 — no DbUpdateException, StackTrace in response

- **Test:** `TC-E3-3-3-CMP-3: should show toast "Contacto creado correctamente" after successful creation`
  - **Status:** RED — ContactoForm + useCreateContacto do not exist yet
  - **Verifies:** AC-2 (P2) — success toast with exact Spanish text (R-010)

- **Test:** `should call onClose after successful contact creation`
  - **Status:** RED — ContactoForm does not exist yet
  - **Verifies:** onClose callback called on success

- **Test:** `should disable submit button while mutation is pending (isPending guard)`
  - **Status:** RED — ContactoForm does not exist yet
  - **Verifies:** btn-submit disabled while useCreateContacto isPending

- **Test:** `should render the form with all four required fields in Spanish`
  - **Status:** RED — ContactoForm does not exist yet
  - **Verifies:** AC-1 / FR9 — all four fields present with Spanish labels

- **Test (additional structure):** Cancel button, data-testid="contacto-form", onClose on cancel, no POST on cancel
  - **Status:** RED — ContactoForm does not exist yet

---

## Data Factories

### Contacto Factory (existing — Story 3.1)

**File:** `frontend/src/modules/crm/contactos/__tests__/contactoFactory.ts`

**Exports:**
- `buildContacto(overrides?)` — Create single Contacto with optional field overrides
- `buildContactoList(count, overridesFn?)` — Create array of Contactos
- `resetContactoCounter()` — Reset counter for deterministic IDs in afterEach

**Example Usage:**
```typescript
const contacto = buildContacto({ email: 'specific@empresa.co' });
const list = buildContactoList(5);
```

### E2E Data Helper (existing)

**File:** `e2e/helpers/data.helper.ts`

**Exports:**
- `buildContacto(overrides?)` — Generates unique Contacto payload for E2E setup

---

## Fixtures

### Base E2E Fixture (existing)

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**
- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Navigated page context
  - **Cleanup:** None required

**Example Usage:**
```typescript
import { test, expect } from '../../fixtures/base.fixture';

test('should open form', async ({ page }) => {
  await page.goto('/contactos');
  // ...
});
```

---

## Mock Requirements

### POST /api/v1/contactos — 201 Success (Component tests)

**Endpoint:** `POST http://localhost:5000/api/v1/contactos`

**Success Response (201):**
```json
{
  "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  "nombre": "Nuevo Contacto SA",
  "cargo": "Analista de Ventas",
  "telefono": "3001112233",
  "email": "nuevo.contacto@empresa.co",
  "clienteId": null,
  "createdAt": "2026-06-28T10:30:00Z",
  "updatedAt": "2026-06-28T10:30:00Z"
}
```

### POST /api/v1/contactos — 409 Conflict (Component + E2E)

**Failure Response (409 — Problem Details RFC 7807):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Conflicto de datos",
  "status": 409,
  "detail": "El email ya está registrado"
}
```

**Notes:** MSW intercepts in component tests; `page.route()` intercept in E2E tests (both network-first — set up BEFORE render/navigation).

---

## Required data-testid Attributes

### /contactos route (ContactosPage)

- `btn-nuevo-contacto` — "Nuevo contacto" trigger button in page header

### /contactos/:contactoId route

- `btn-nuevo-contacto` — Same button must also be present in detail route (AC-1)

### ContactoForm component

- `contacto-form` — The `<form>` element
- `input-nombre` — Nombre input field
- `input-cargo` — Cargo input field
- `input-telefono` — Teléfono input field
- `input-email` — Email input field
- `btn-submit` — "Crear contacto" submit button (disabled while isPending)
- `btn-cancel` — "Cancelar" button (never submits, calls onClose)

**Implementation Example:**
```tsx
<form onSubmit={handleSubmit(onSubmit)} data-testid="contacto-form">
  <input {...register('nombre')} data-testid="input-nombre" aria-describedby="error-nombre" />
  <input {...register('cargo')} data-testid="input-cargo" aria-describedby="error-cargo" />
  <input {...register('telefono')} data-testid="input-telefono" aria-describedby="error-telefono" />
  <input type="email" {...register('email')} data-testid="input-email" aria-describedby="error-email" />
  <button type="button" onClick={onClose} data-testid="btn-cancel">Cancelar</button>
  <button type="submit" disabled={isPending} data-testid="btn-submit">
    {isPending ? 'Creando...' : 'Crear contacto'}
  </button>
</form>
```

---

## Implementation Checklist

### Test: `PostContacto_WithValidPayload_Returns201AndContactoDto` (TC-E3-3-3-API-1, P0)

**File:** `backend/tests/SiesaAgents.UnitTests/Contactos/CreateContactoApiTests.cs`

**Tasks to make this test pass:**

- [ ] Verify `POST /` endpoint exists in `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` (lines 35–62)
- [ ] Verify `CreateContactoRequest` record in `SiesaAgents.Application/Contactos/DTOs/`
- [ ] Verify `CreateContactoRequestValidator` in `SiesaAgents.Application/Contactos/Validators/`
- [ ] Verify `IContactoRepository.AddAsync` and `SaveChangesAsync` are implemented
- [ ] Verify response returns `Results.Created(...)` (201) with `ContactoDto` shape (DateTimeOffset, not DateTime)
- [ ] Run test: `dotnet test --filter "TC-E3-3-3-API-1" backend/tests/SiesaAgents.UnitTests/`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (verification only — endpoint already implemented in Story 3.1)

---

### Test: `PostContacto_ThenGetList_NewContactAppearsInList` (TC-E3-3-3-API-2, P0)

**File:** `backend/tests/SiesaAgents.UnitTests/Contactos/CreateContactoApiTests.cs`

**Tasks to make this test pass:**

- [ ] Verify GET /api/v1/contactos returns newly created contacts (no cache issue)
- [ ] Verify POST response Location header contains /api/v1/contactos/{id}
- [ ] Run test: `dotnet test --filter "TC-E3-3-3-API-2" backend/tests/SiesaAgents.UnitTests/`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `PostContacto_WithEmptyBody_Returns400WithProblemDetails` (TC-E3-3-3-API-3, P1)

**File:** `backend/tests/SiesaAgents.UnitTests/Contactos/CreateContactoApiTests.cs`

**Tasks to make this test pass:**

- [ ] Verify `CreateContactoRequestValidator` uses `Results.ValidationProblem(...)` for invalid input
- [ ] Verify errors object in Problem Details contains at least one error key
- [ ] Run test: `dotnet test --filter "TC-E3-3-3-API-3" backend/tests/SiesaAgents.UnitTests/`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `PostContacto_WithDuplicateEmail_Returns409Conflict` (TC-E3-3-3-API-4, P1)

**File:** `backend/tests/SiesaAgents.UnitTests/Contactos/CreateContactoApiTests.cs`

**Tasks to make this test pass:**

- [ ] Verify `uk_contactos_email` unique index exists on Contactos table (from Story 3.1 AI review)
- [ ] Verify `catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))` handler returns 409 Problem Details
- [ ] Verify detail message contains "email" (case-insensitive) — no stack trace (NFR6)
- [ ] Run test: `dotnet test --filter "TC-E3-3-3-API-4" backend/tests/SiesaAgents.UnitTests/`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `TC-E3-3-3-UNIT-1 through UNIT-4` — Validator rejects null fields (P2)

**File:** `backend/tests/SiesaAgents.UnitTests/Contactos/CreateContactoValidatorTests.cs`

**Tasks to make these tests pass:**

- [ ] Verify `CreateContactoRequestValidator` uses `.NotEmpty()` for Nombre, Cargo, Telefono, Email
- [ ] Verify Email uses `.EmailAddress()` rule
- [ ] Run tests: `dotnet test --filter "CreateContactoValidatorTests" backend/tests/SiesaAgents.UnitTests/`
- [ ] ✅ All 4 tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `TC-E3-3-3-CMP-1` — Empty submit → 4 inline errors, POST never called (P0)

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoForm.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx`
- [ ] Configure `react-hook-form` with `zodResolver(contactoSchema)` for client-side validation
- [ ] Add `<span role="alert">` inline error renders for each of the 4 fields
- [ ] Ensure Zod validation fires on submit without calling `mutate()` when invalid
- [ ] Add `data-testid` attributes: `contacto-form`, `input-nombre`, `input-cargo`, `input-telefono`, `input-email`, `btn-submit`, `btn-cancel`
- [ ] Run test: `pnpm --filter frontend test -- ContactoForm.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: `TC-E3-3-3-CMP-2` — 409 → inline Email error (P2)

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoForm.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/contactos/application/useCreateContacto.ts` (TanStack Query `useMutation`)
- [ ] Extend `contactoApiRepository.ts` with `create()` method (POST /api/v1/contactos)
- [ ] In ContactoForm: detect 409 via `axios.isAxiosError(error) && error.response?.status === 409`
- [ ] On 409: call `setError('email', { message: 'El email ya está registrado' })` on the RHF instance
- [ ] Run test: `pnpm --filter frontend test -- ContactoForm.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `TC-E3-3-3-CMP-3` — Valid submit → toast "Contacto creado correctamente" (P2)

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoForm.test.tsx`

**Tasks to make this test pass:**

- [ ] In `useCreateContacto` `onSuccess`: call `toast.success('Contacto creado correctamente')` (exact text — R-010)
- [ ] In `useCreateContacto` `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['contactos'] })` (FR27 / R-002)
- [ ] Run test: `pnpm --filter frontend test -- ContactoForm.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `TC-E3-3-3-E2E-1` — Full create journey (P1)

**File:** `e2e/tests/contactos/contactos-create.spec.ts`

**Tasks to make this test pass:**

- [ ] Add "Nuevo contacto" button (`data-testid="btn-nuevo-contacto"`) in `frontend/src/routes/_app/contactos.tsx`
- [ ] Wire Dialog open/close state with `useState<boolean>` (`isFormOpen`)
- [ ] Render `<ContactoForm onClose={() => setIsFormOpen(false)} />` inside shadcn/ui Dialog
- [ ] Add same button in `frontend/src/routes/_app/contactos.$contactoId.tsx`
- [ ] Verify contacto-list-item data-testid exists in ContactoListView (from Story 3.1)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-create.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all component tests for ContactoForm
pnpm --filter frontend test -- ContactoForm.test.tsx

# Run all component tests for contactos module
pnpm --filter frontend test -- contactos

# Run E2E tests for Story 3.3
npx playwright test e2e/tests/contactos/contactos-create.spec.ts

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/contactos/contactos-create.spec.ts --headed

# Debug specific E2E test
npx playwright test e2e/tests/contactos/contactos-create.spec.ts --debug

# Run backend API tests for Story 3.3
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "CreateContactoApiTests"

# Run backend validator unit tests
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "CreateContactoValidatorTests"

# Run all backend contacto tests
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "Namespace~Contactos"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (ContactoForm component does not exist yet)
- ✅ Backend API and validator tests exist and target verified endpoints
- ✅ E2E tests target btn-nuevo-contacto and contacto-form testids (not yet implemented)
- ✅ MSW network-first handlers set up BEFORE render in component tests
- ✅ page.route() intercepts set BEFORE page.goto() in E2E tests
- ✅ data-testid requirements documented
- ✅ Implementation checklist created

**Verification:**

- Component tests fail: `Cannot find module '../presentation/ContactoForm'`
- E2E tests fail: `btn-nuevo-contacto` locator not found on /contactos page
- Backend tests may pass (endpoint already implemented in Story 3.1) — confirm with `dotnet test`

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Verify backend** (Story 3.1 already implemented): run `dotnet test --filter "CreateContacto"` — should be GREEN
2. **Create `useCreateContacto.ts`** with `useMutation`, `invalidateQueries(['contactos'])`, and `toast.success`
3. **Extend `contactoApiRepository.ts`** with `create()` method
4. **Create `ContactoForm.tsx`** with react-hook-form + zodResolver + all data-testid attributes
5. **Wire "Nuevo contacto" button** in `/contactos` and `/contactos/:contactoId` routes with Dialog
6. **Run component tests** after each step: `pnpm --filter frontend test -- ContactoForm.test.tsx`
7. **Run E2E tests** when frontend is running: `npx playwright test contactos-create.spec.ts`

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently for immediate feedback

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Extract duplications between `ContactoForm` and `ClienteForm` if applicable
3. Validate TypeScript strict mode (no `any`)
4. Ensure WCAG 2.1 AA: `aria-describedby` on each input pointing to error span `id`
5. Run all tests after each refactor to confirm stability

---

## Next Steps

1. **Run backend tests** to confirm RED/GREEN state: `dotnet test --filter "CreateContacto"`
2. **Run component tests** to confirm RED: `pnpm --filter frontend test -- ContactoForm.test.tsx`
3. **Begin implementation** using implementation checklist as guide (start with useCreateContacto.ts)
4. **Work one test at a time** (red → green for each)
5. **Share progress** in daily standup
6. **When all tests pass**, refactor code for quality
7. **When refactoring complete**, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — `page.route()` BEFORE `page.goto()` in all E2E tests; MSW handlers set up BEFORE render in component tests
- **fixture-architecture.md** — Base fixture with `contactosPage` fixture; ApiHelper for setup/teardown
- **data-factories.md** — `buildContacto()` factory with override support for unique test data
- **component-tdd.md** — RTL + MSW pattern with isolated QueryClient per test
- **test-quality.md** — Given-When-Then structure, one assertion per test focus, explicit waits
- **selector-resilience.md** — `data-testid` selectors throughout (never CSS class selectors)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Component tests command:** `pnpm --filter frontend test -- ContactoForm.test.tsx`

**Expected failure:**
```
FAIL frontend/src/modules/crm/contactos/__tests__/ContactoForm.test.tsx
  Cannot find module '../presentation/ContactoForm' from 'ContactoForm.test.tsx'
```

**E2E tests command:** `npx playwright test e2e/tests/contactos/contactos-create.spec.ts`

**Expected failure:**
```
Error: locator.click: Error: strict mode violation: getByTestId('btn-nuevo-contacto')
  resolves to 0 elements
```

**Summary:**

- Component tests: 12 tests — Failing (ContactoForm module not found — RED phase)
- E2E tests: 6 tests — Failing (btn-nuevo-contacto not implemented — RED phase)
- Backend API tests: 6 tests — Expected GREEN (endpoint implemented in Story 3.1)
- Backend unit tests: 4 tests — Expected GREEN (validator implemented in Story 3.1)
- **Status:** RED phase confirmed for frontend; backend verification needed

---

## Notes

- Backend endpoint `POST /api/v1/contactos` is confirmed implemented in Story 3.1 (`ContactoEndpoints.cs` lines 35–62). Backend tests should pass immediately on run — verify with `dotnet test` before starting frontend implementation.
- `contactoSchema.ts` (Zod schema with Spanish error messages) already exists from Story 3.1 — do NOT recreate.
- `contactoFactory.ts` already exists from Story 3.1 — reused in component tests.
- The E2E test `TC-E3-3-3-E2E-1` uses the real backend (no mock) to validate the full stack including FR27 `invalidateQueries` behavior (R-002 risk).
- 409 email conflict handling is per R-001: not a PRD requirement but must be handled gracefully since the DB enforces it via `uk_contactos_email` index.

---

**Generated by BMad TEA Agent** — 2026-06-28
