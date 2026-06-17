# Automation Summary — Story 2.3: Crear Cliente

**Date:** 2026-06-17
**Story:** 2.3 — Crear Cliente
**Epic:** 2 — Gestión de Clientes
**Coverage Target:** critical-paths + edge-cases
**Mode:** BMad-Integrated

---

## Tests Created

### Component Tests (P1-P2) — ClienteForm edge cases

- `frontend/src/modules/crm/clientes/presentation/ClienteForm.edge-cases.test.tsx` (12 tests + 1 todo)
  - [P1] 500 server error → toast.error() called with generic message
  - [P1] 500 server error → onClose NOT called (form stays open)
  - [P1] 500 server error → onSuccess NOT called
  - [P1] Network error (HttpResponse.error) → toast.error() called
  - [P1] Network error → onClose NOT called
  - [P1] After 409, user corrects NIT and resubmits → onClose called (success)
  - [P1] onSuccess callback receives the created cliente object from API
  - [P2] Form has aria-label "Formulario de nuevo cliente"
  - [P2] "Cancelar" button has accessible aria label
  - [P2] "Guardar" button has accessible aria label
  - [P3] "Guardar" button starts enabled (not disabled) when form is idle
  - [P3] Multiple Cancel clicks each call onClose
  - [TODO] Whitespace-only "nombre" should block submission — schema gap (see below)

### Unit Tests (P2-P3) — clienteSchema boundary conditions

- `frontend/src/modules/crm/clientes/application/clienteSchema.edge-cases.test.ts` (12 tests)
  - [P2] nombre = exactly 200 chars → passes validation
  - [P2] nitRuc = exactly 50 chars → passes validation
  - [P2] telefono = exactly 50 chars → passes validation
  - [P2] ciudad = exactly 100 chars → passes validation
  - [P2] nombre = 201 chars → fails with Spanish error mentioning "200"
  - [P2] nitRuc = 51 chars → fails with Spanish error mentioning "50"
  - [P2] telefono = 51 chars → fails with Spanish error mentioning "50"
  - [P2] ciudad = 101 chars → fails with Spanish error mentioning "100"
  - [P3] nombre = number (wrong type) → fails gracefully
  - [P3] nitRuc = null → fails gracefully
  - [P3] telefono = undefined → fails gracefully
  - [P3] Extra fields stripped (Zod default strip mode)

---

## Infrastructure Used

- Existing MSW setup (no new fixtures/factories needed for component-level tests)
- vi.hoisted() pattern for toast mocks (siesa-ui-kit ToastProvider not in test tree)
- QueryClientProvider wrapper with retry: false for deterministic test behavior

---

## Coverage Analysis

**Total New Tests:** 24 passing + 1 todo
- P1: 7 tests (component — error path coverage)
- P2: 12 tests (schema boundary + accessibility)
- P3: 3 tests (idle state, multi-click, type safety)
- TODO: 1 (whitespace schema gap)

**Test Levels:**
- E2E: 0 tests (happy path already covered in ATDD, not duplicated)
- API: 0 tests (component-level MSW interception sufficient)
- Component: 12 tests (error paths, re-submit after 409, onSuccess with data, aria)
- Unit: 12 tests (schema boundary conditions, type safety)

**Coverage Gaps Closed vs ATDD:**
- ✅ 500 error → toast.error path (not in ATDD)
- ✅ Network error → toast.error path (not in ATDD)
- ✅ Re-submit after 409 correction (not in ATDD)
- ✅ onSuccess receives typed Client object (not in ATDD)
- ✅ Form accessibility aria attributes (not in ATDD)
- ✅ Schema max-length boundary conditions (not in ATDD)
- ✅ Non-string type safety in schema (not in ATDD)
- ✅ Zod strip behavior for extra fields (not in ATDD)

---

## Schema Gap Identified (test.todo)

**Issue:** `clienteSchema` uses `z.string().min(1)` which passes whitespace-only strings.
- " " (3 spaces) has character count = 3, so `min(1)` passes it
- react-hook-form does NOT trim inputs by default
- Result: whitespace-only "nombre" passes validation and triggers an API POST

**Fix Required:** Update `clienteSchema.ts`:
```typescript
nombre: z.string().trim().min(1, 'El nombre es requerido').max(200, 'Máximo 200 caracteres'),
nitRuc: z.string().trim().min(1, 'El NIT/RUC es requerido').max(50, 'Máximo 50 caracteres'),
telefono: z.string().trim().min(1, 'El teléfono es requerido').max(50, 'Máximo 50 caracteres'),
ciudad: z.string().trim().min(1, 'La ciudad es requerida').max(100, 'Máximo 100 caracteres'),
```
**Priority:** P2 — Review with team (business logic decision on trimming)

---

## Healing Report

**Healing Round 1 (5 tests):** 500/network error tests were checking DOM text for toast
- Root cause: `siesa-ui-kit` toast requires `ToastProvider` in the component tree
- Fix applied: Mock `siesa-ui-kit` toast using `vi.hoisted()` pattern, assert `mockToastError` was called
- Result: ✅ All 5 tests now pass

**Healing Round 2 (1 test):** `test.fixme` does not exist in Vitest
- Fix applied: Changed to `it.todo` with detailed comment explaining the schema gap
- Result: ✅ Test file loads correctly, todo is documented

**Healing Round 3 (1 test):** `vi.mock()` referencing `const mockToastError` before initialization
- Fix applied: Used `vi.hoisted()` to define mock fns before hoisting
- Result: ✅ Module loads correctly, all tests run

---

## Definition of Done

- [x] All tests follow Given-When-Then format
- [x] All tests have priority tags [P1]/[P2]/[P3]
- [x] Component tests use RTL (not Playwright CT — project uses Vitest + RTL)
- [x] No hard waits/sleeps (except 200ms intentional network tracking delay from ATDD pattern)
- [x] Tests are self-isolated (no shared state between tests)
- [x] Deterministic (MSW server reset in afterEach)
- [x] Schema gap documented with actionable fix recommendation
- [x] No duplicate coverage with ATDD tests (different scenarios)
- [x] 24/24 tests pass (+ 1 todo schema gap)

---

## Test Execution

```bash
# Run all story 2.3 edge case tests
cd frontend && npx vitest run src/modules/crm/clientes/application/clienteSchema.edge-cases.test.ts
cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteForm.edge-cases.test.tsx

# Run full clientes module tests
cd frontend && npx vitest run src/modules/crm/clientes/
```

## Next Steps

1. Review schema gap with team: add `.trim()` to all 4 fields in `clienteSchema.ts`
2. Run tests in CI pipeline
3. Integrate with quality gate: `bmad tea *gate`
4. Monitor for flaky tests in burn-in loop
