---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/2-5-delete-client.md
story_key: 2-5-delete-client
---

# Code Review: 2-5-delete-client

- **Date**: 2026-06-28
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: In Progress

## Initial Discovery

- **Undocumented Changes (in Git but NOT in Story File List)**:
  - `frontend/src/modules/crm/clientes/__tests__/DeleteCliente.edge.test.tsx` — committed in `c6265d7` but absent from story's Dev Agent Record File List
  - `e2e/tests/clientes/clientes-delete-edge-cases.spec.ts` — untracked file not committed and not in story File List

- **Files in Story but NOT in Git**: None — all declared files are present.

- **Uncommitted Changes**: `e2e/tests/clientes/clientes-delete-edge-cases.spec.ts` is untracked.

---

## Review Plan

### Items to Verify
- [x] AC1: Confirmation dialog with "¿Eliminar este cliente?" + "Confirmar"/"Cancelar" buttons
- [x] AC2: DELETE /api/v1/clientes/:id → 204/200, list refresh, empty right panel, toast
- [x] AC3: Cancel keeps record unchanged, no DELETE call
- [x] AC4: hadContacts path — different toast text, contacts SET NULL

### Focus Areas
- Backend exception handling: bare `catch {}` in handler
- Orphan interface method: `DeleteAsync(Guid id)` on `IClienteRepository`
- AlertDialog WCAG: missing `aria-labelledby` on `role="alertdialog"`
- `clienteApiRepository.delete` type assertion: `as { hadContacts: boolean }` on 200 response
- Test isolation: `IClassFixture<WebApplicationFactory>` shared DB, `MigrateAsync` only in one test
- Documentation: edge test file not in story File List

---

## Review Findings

### Critical Issues (Must Fix)

None found.

### High Issues (Should Fix Before Done)

#### [HIGH-1] Bare `catch {}` in `DeleteClienteCommandHandler` silently swallows ALL exceptions

**File**: `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs` lines 20–24

```csharp
catch
{
    // Epic 3 dependency: contactos table may not exist yet — treat as 0
    contactCount = 0;
}
```

**Problem**: This bare `catch` block is intended to handle only the Epic 3 dependency (Contactos table not existing). However, it swallows ALL exceptions thrown by `CountContactosByClienteIdAsync`, including legitimate infrastructure failures (connection timeouts, transient DB errors, programming errors). An `OperationCanceledException` from a cancelled `CancellationToken` will also be swallowed, preventing proper request cancellation propagation.

**Impact**: When Epic 3 is implemented and the real method is active, a transient DB error on `CountContactosByClienteIdAsync` would silently proceed with deletion while reporting `hadContacts: false` — a data integrity hazard.

**Fix**: Catch only the specific exception type that indicates the table does not exist, or add a feature flag / stub method at the infrastructure level so the handler never needs a `catch` block.

---

#### [HIGH-2] `IClienteRepository` has two orphaned `DeleteAsync` overloads — violation of Interface Segregation

**File**: `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` lines 11–12

```csharp
Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
Task DeleteAsync(ClienteEntity entity, CancellationToken cancellationToken = default);
```

**Problem**: `DeleteAsync(Guid id, CancellationToken)` was the original method from a prior story. Story 2.5 added the `entity` overload and uses it exclusively in `DeleteClienteCommandHandler`. The `Guid`-based overload:
1. Is **never called** by any handler, endpoint, or test (confirmed via grep).
2. In `ClienteRepository`, its implementation does NOT call `SaveChangesAsync` after removing the entity — it removes the entity from the change tracker but commits nothing, making it a silent no-op for callers.
3. It is dead code that pollutes the domain interface.

**Fix**: Remove `DeleteAsync(Guid id, CancellationToken)` from `IClienteRepository` and its implementation from `ClienteRepository` since it has no callers and has a correctness bug (missing `SaveChangesAsync`).

---

### Medium Issues (Should Fix)

#### [MED-1] Custom `AlertDialog` missing `aria-labelledby` — WCAG 2.1 AA violation

**File**: `frontend/src/components/ui/alert-dialog.tsx` lines 42–53

```tsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center"
  role="alertdialog"
  aria-modal="true"
>
```

**Problem**: WCAG 2.1 requires `role="alertdialog"` to have an accessible name via `aria-labelledby` pointing to the dialog title element, or `aria-label`. The current custom implementation lacks this. Screen readers will announce a dialog with no name.

The story's enforcement checklist explicitly requires WCAG 2.1 AA compliance and aria attributes.

**Fix**: Add `id` to `AlertDialogTitle`'s `<h2>` and reference it from `AlertDialogContent`'s `aria-labelledby`. Since the custom component uses Context, this can be done with a generated ID or a static ID pattern.

---

#### [MED-2] `clienteApiRepository.delete` uses unsafe `as` type assertion for 200 response

**File**: `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` line 32

```typescript
return response.data as { hadContacts: boolean };
```

**Problem**: The `as` cast is a TypeScript compile-time assertion — it provides zero runtime safety. If the backend ever returns 200 with an unexpected body shape (e.g., empty object `{}`, or `{ hadContacts: null }`), `result?.hadContacts` in `ClienteDetailView` evaluates to `undefined`/`null`, which is falsy, so the generic toast is shown when the contacts-variant was expected. No error is thrown, making this failure mode invisible.

**Fix**: Use a runtime check (e.g., `typeof response.data?.hadContacts === 'boolean'`) before returning, or a Zod schema parse. At minimum, replace `as` with an explicit property access that handles the falsy case explicitly.

---

#### [MED-3] Undocumented committed file and untracked file not in story File List

**Files**:
- `frontend/src/modules/crm/clientes/__tests__/DeleteCliente.edge.test.tsx` — committed in git, absent from story's **Dev Agent Record > File List**
- `e2e/tests/clientes/clientes-delete-edge-cases.spec.ts` — untracked (not committed), not in story File List

**Problem**: The story claims "All 15 frontend ATDD tests pass" — but there are actually 28 tests across `DeleteCliente.test.tsx` (15) and `DeleteCliente.edge.test.tsx` (13). The edge test file, which tests important scenarios (double-click prevention, cache eviction, 404 response handling), is committed but not documented.

The untracked E2E file exists on disk but is not committed nor documented.

**Fix**: Update story Dev Agent Record > File List to include `DeleteCliente.edge.test.tsx` as a Created file. Add `e2e/tests/clientes/clientes-delete-edge-cases.spec.ts` and either commit it or explicitly note it as deferred.

---

### Low Issues / Suggestions

#### [LOW-1] Backend integration tests share WebApplicationFactory with MigrateAsync only in one test

**File**: `backend/tests/SiesaAgents.UnitTests/Clientes/DeleteClienteApiTests.cs` lines 47–49

```csharp
// Only in DeleteCliente_WithValidId_Returns204NoContent test
using var scope = _factory.Services.CreateScope();
var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
await dbContext.Database.MigrateAsync();
```

**Problem**: `IClassFixture<WebApplicationFactory<Program>>` means a single factory instance is shared across all tests in the class. `MigrateAsync` is called only inside `DeleteCliente_WithValidId_Returns204NoContent`. If xUnit executes tests in a different order (which is not guaranteed), other tests that don't call `MigrateAsync` may run against a non-migrated schema. This is the same pattern used in prior stories and may be acceptable given the existing pattern is established, but it is fragile.

This is consistent with the pre-existing pattern in `GetClienteByIdApiTests` and `CreateClienteApiTests`, so it is not a regression introduced by this story.

**Suggestion**: Move `MigrateAsync` to the constructor or a dedicated `IAsyncLifetime.InitializeAsync` method shared across all tests.

---

#### [LOW-2] `DeleteCliente_WithNoContactosTable_Returns204_TechDebt_Epic3` test has a weak assertion

**File**: `backend/tests/SiesaAgents.UnitTests/Clientes/DeleteClienteApiTests.cs` lines 146–153

```csharp
Assert.True(
    deleteResponse.StatusCode == HttpStatusCode.NoContent ||
    deleteResponse.StatusCode == HttpStatusCode.OK,
    $"Expected 204 or 200, got: {deleteResponse.StatusCode}");
```

**Problem**: This assertion accepts both 204 and 200 to "document the tech debt." The current implementation always returns 204 (stub returns 0 contacts), so the test always passes with 204. However, when Epic 3 implements real contacts, this test will not detect the regression that it previously returned 204 (now 200) — both are valid according to the assertion. The test is self-defeating for its stated purpose.

**Suggestion**: Assert specifically `HttpStatusCode.NoContent` (204) for the current state, with a comment noting "change to 200 assertion once Epic 3 is implemented and contacts are seeded."

---

## Fix Outcome

Applying auto-fixes for HIGH-2 (orphan interface method) and MED-3 (story file list documentation) since these are safe to auto-correct:

- **HIGH-2**: Remove `DeleteAsync(Guid id, CancellationToken)` from interface and repository
- **MED-3**: Update story file list

HIGH-1 (bare catch) and MED-1 (AlertDialog WCAG) and MED-2 (type assertion) left for manual fix assessment below.

- **Action Taken**: Partial auto-fix + remaining action items
- **Recommended Status**: in-progress (HIGH-1 and MED-1/MED-2 require manual review decision)

## Status Sync
- **Story File Status**: Updated to in-progress
- **Sprint Status YAML**: Synced — 2-5-delete-client -> in-progress
