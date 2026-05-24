---
story: 2-2-client-detail-view
storyTitle: "Client Detail View"
epic: 2
phase: ATDD
status: red
createdAt: "2026-05-24"
---

# ATDD Checklist — Story 2.2: Client Detail View

## Status: RED (tests generated, implementation pending)

---

## Acceptance Criteria Coverage

| AC | Description | Test Case(s) | Level | Status |
|----|-------------|-------------|-------|--------|
| AC1 | Click client item → right panel shows Nombre, NIT/RUC, Teléfono, Ciudad; URL updates to `/clientes/:clienteId` | TC-E2-P1-06a (component), AC1 E2E | Component + E2E | RED |
| AC2 | Direct URL `/clientes/:clienteId` → correct client detail loaded (FR30 deep linking) | TC-E2-P1-05 E2E, TC-E2-P1-06a component, useCliente hook tests | E2E + Component + Unit | RED |
| AC3 | Non-existent `clienteId` → not-found message "Cliente no encontrado." displayed, no JS error | TC-E2-P1-06b (component), AC3 E2E smoke | Component + E2E | RED |
| AC4 | Selected client item is visually highlighted (Siesa Blue `#0e79fd` left border or background) | AC4 E2E — aria-selected="true" assertion | E2E | RED |
| AC5 | All four fields (Nombre, NIT/RUC, Teléfono, Ciudad) visible and WCAG 2.1 AA compliant | TC-E2-P1-06a + axe accessibility test | Component | RED |

---

## Generated Test Files

### Backend — Unit Tests

| File | Test Count | Test Case(s) |
|------|-----------|-------------|
| `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` | 7 | TC-E2-P1-02 handler layer: entity→DTO mapping (5 tests), null→null for not-found (2 tests) |

### Frontend — Application Layer Tests (Vitest)

| File | Test Count | Test Case(s) |
|------|-----------|-------------|
| `frontend/src/modules/crm/clientes/application/useCliente.test.ts` | 7 | AC2 hook resolves with ClienteDto (3 tests), AC3 hook isError on 404 (2 tests), boundary: disabled when id empty (1 test) — plus 1 query key test |

### Frontend — Component Tests (Vitest + RTL + MSW)

| File | Test Count | Test Case(s) |
|------|-----------|-------------|
| `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx` | 12 | TC-E2-P1-06a: 6 tests (root testid + 4 fields + all-fields-simultaneous), TC-E2-P1-06b: 3 tests (not-found testid, exact message, no fields), TC-E2-P1-06c: 1 test (skeleton visible, fields absent), AC5: 2 tests (axe zero violations, semantic HTML) |

### E2E — Playwright (pre-existing)

| File | Test Count | Test Case(s) |
|------|-----------|-------------|
| `e2e/tests/clientes/client-detail-view.spec.ts` | 7 | TC-E2-P1-05 (3 tests), AC1 (2 tests), AC4 (1 test), AC3 E2E smoke (1 test) |

### Support Files Updated

| File | Change |
|------|--------|
| `frontend/src/tests/handlers/clienteHandlers.ts` | Added `handleGetClienteByIdSuccess()` and `handleGetClienteByIdNotFound()` handler builders for Story 2.2 |

---

## Test Summary

| Level | Count | Status |
|-------|-------|--------|
| Backend Unit (xUnit) | 7 | RED |
| Frontend Hook Unit (Vitest) | 7 | RED |
| Frontend Component (Vitest+RTL+MSW) | 12 | RED |
| E2E (Playwright) | 7 | RED (pre-existing) |
| **Total** | **33** | **RED** |

---

## Execution Order

```
Phase 1 — Backend Unit Tests (no DB required)
  GetClienteByIdQueryHandlerTests (7)

Phase 2 — Frontend Unit Tests (MSW, no backend)
  useCliente.test.ts (7)

Phase 3 — Frontend Component Tests (MSW, no backend)
  ClienteDetailView.test.tsx (12)

Phase 4 — E2E (full stack: backend + frontend + PostgreSQL)
  client-detail-view.spec.ts (7)
```

---

## RED Phase Failures Expected

The following implementations do NOT exist yet and will cause test failures:

- `SiesaAgents.Application.Clientes.Queries.GetClienteByIdQuery` (record with `Guid Id`)
- `SiesaAgents.Application.Clientes.Queries.GetClienteByIdQueryHandler`
- `IClienteRepository.GetByIdAsync(Guid id)` (may or may not exist from Story 2.1)
- `GET /api/v1/clientes/{id:guid}` endpoint in `ClienteEndpoints.cs`
- `frontend/src/modules/crm/clientes/application/useCliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — `getById(id: string)` method
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — `getById(id)` method
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/routes/_app/clientes.$clienteId.tsx` — full implementation (may exist as stub)

---

## GREEN Phase — Implementation Checklist

- [ ] `GetClienteByIdQuery` record with `Guid Id` parameter
- [ ] `GetClienteByIdQueryHandler.HandleAsync()` returns `ClienteDto?` — null when entity not found
- [ ] `IClienteRepository.GetByIdAsync(Guid id)` interface method
- [ ] `ClienteRepository.GetByIdAsync()` using `AsNoTracking().FirstOrDefaultAsync()`
- [ ] `GET /{id:guid}` route in `ClienteEndpoints.cs` — returns 200 or 404 (Problem Details)
- [ ] `useCliente(id)` hook with `queryKey: ['clientes', id]`, `enabled: !!id`
- [ ] `IClienteRepository.getById(id: string): Promise<Cliente>` (frontend domain interface)
- [ ] `clienteApiRepository.getById(id)` — throws on non-2xx so TanStack Query sets isError
- [ ] `ClienteDetailView.tsx` with:
  - `data-testid="cliente-detail-view"` on root element
  - `data-testid="not-found-message"` on not-found element with exact text "Cliente no encontrado."
  - `aria-label="Cargando detalle del cliente"` on skeleton loading container
  - Semantic HTML (`<dl>/<dt>/<dd>` or `<section>` with heading) for label-value pairs
  - WCAG 2.1 AA compliance (axe zero violations)
- [ ] `clientes.$clienteId.tsx` route renders `<ClienteDetailView clienteId={clienteId} />`
- [ ] `ClienteListView.tsx` wires `onClick` → `navigate('/clientes/$clienteId')` and `isSelected` from URL params

---

## Key Constraints Enforced by Tests

1. **`data-testid="cliente-detail-view"`** — Required on root element of detail view (ClienteDetailView.test.tsx)
2. **`data-testid="not-found-message"`** — Required on not-found element with exact text "Cliente no encontrado." (ClienteDetailView.test.tsx)
3. **`aria-label="Cargando detalle del cliente"`** — Required on loading skeleton container (ClienteDetailView.test.tsx)
4. **`queryKey: ['clientes', id]`** — Verified in useCliente.test.ts (separate from `['clientes']` list cache)
5. **`enabled: !!id`** — Hook must not fetch when id is empty string (useCliente.test.ts)
6. **isError = true on 404** — `clienteApiRepository.getById` must throw on non-2xx (useCliente.test.ts)
7. **Semantic HTML** — `<dl>/<dt>/<dd>` or `<section>` for label-value pairs (AC5 accessibility test)
8. **Network-first E2E intercepts** — All E2E tests use `page.route()` BEFORE `page.goto()` (client-detail-view.spec.ts)
9. **Exact not-found text** — "Cliente no encontrado." (period included) as per AC3 story spec
10. **No ErrorPanel for 404** — Not-found state uses inline message, not the shared `ErrorPanel` component
