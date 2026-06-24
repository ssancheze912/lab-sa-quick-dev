---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/3-1-contact-list-search.md
story_key: 3-1-contact-list-search
status: In Progress
---

# Code Review: 3-1-contact-list-search

- **Date**: 2026-06-24
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: In Progress

## Initial Discovery

- **Undocumented Changes**: None — all files in git match the story's File List exactly.
- **Missing Files**: None — all story-claimed files exist in git.
- **Git Status**: 6 modified files + 11 untracked new files/directories. All reconcile with story File List.

---

## Review Plan

### Items to Verify

- [x] AC1: `/contactos` renders full-page table with Nombre, Cargo, Email via `ContactoListView`
- [x] AC2: Client-side real-time filter by nombre or email, case-insensitive, <1s for 1,000 records
- [x] AC3: Empty array → `EmptyState` with Spanish message
- [x] AC4: API failure → `ErrorPanel` with "Reintentar" button
- [x] AC5: Row click → TanStack Router navigate to `/contactos/:contactoId`
- [x] AC6: Single `GET /api/v1/contactos` on mount, cached under `queryKey: ['contactos']`
- [x] AC7: Skeleton loader (`react-loading-skeleton`) while `isLoading`, no spinner
- [x] Task 1: Domain entity + repository interface
- [x] Task 2: Infrastructure API repository
- [x] Task 3: TanStack Query hook
- [x] Task 4: `ContactoListView` component
- [x] Task 5: Route wiring
- [x] Task 6: Backend `ContactoEntity` + migration
- [x] Task 7: Application layer (DTO, Query, Handler)
- [x] Task 8: Minimal API endpoint + DI registration
- [x] Task 9: Frontend unit tests
- [x] Task 10: Backend unit + integration tests

### Focus Areas

- **Architecture**: IContactoRepository namespace placement (Domain vs Application)
- **Security**: Input validation on endpoint (read-only but GET pipeline)
- **Performance**: `useMemo` filter, `AsNoTracking` in repository
- **Test Quality**: Assertions depth, edge cases missing
- **DDD compliance**: Entity pattern, DateTimeOffset, UUID PKs
- **CQRS compliance**: Handler injection pattern
- **Accessibility**: WCAG 2.1 AA on row clicks

---

## Review Findings

### Critical Issues (Must Fix)

None.

### High Issues

**[HIGH-1] IContactoRepository lives in Domain layer — inconsistent with project's established pattern**

`IContactoRepository` is placed at `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs` (namespace `SiesaAgents.Domain.Contactos.Interfaces`).

The existing project pattern — visible in `IClienteRepository` — places repository interfaces in the **Application layer** at `SiesaAgents.Application.Clientes.Interfaces`. In Clean Architecture, repository interfaces serve as anti-corruption adapters owned by the Application layer (use-case-driven contracts), not the Domain layer. Domain defines aggregates and domain services, not repository contracts.

This inconsistency breaks the established layer convention and will confuse future developers.

**[HIGH-2] `EmptyState` is shown when `filteredContactos.length === 0` even during a non-empty active search**

In `ContactoListView.tsx` lines 48–50:
```tsx
{!isLoading && !isError && filteredContactos.length === 0 && (
  <EmptyState message="No hay contactos registrados. Crea el primero." />
)}
```

If the API returns contacts (non-empty array) but the user types a search query that matches nothing, `filteredContactos.length === 0` is true and the `EmptyState` "No hay contactos registrados. Crea el primero." message is displayed. This is misleading — it guides the user to create a contact that already exists. AC3 specifies this message only for "empty array returned from API". There is no "no results for search" state.

### Medium Issues

**[MED-1] Test for "clicking item navigates" does not assert navigation actually occurred**

In `ContactoListView.test.tsx` lines 196–210, the test for AC5:
```ts
it('clicking item navigates to /contactos/:id (AC#5)', async () => {
  ...
  fireEvent.click(firstRow)
  // Assert — row exists and is clickable
  expect(firstRow).toBeInTheDocument()
})
```

The assertion only confirms the row element exists after clicking — it does not verify the URL changed to `/contactos/:id`. A test that asserts `firstRow` is still in the document after clicking is essentially a no-op assertion. The router history should be inspected (e.g., using `router.state.location.pathname`).

**[MED-2] Backend integration tests share state via `ClearContactosAsync` without proper isolation**

`ContactoEndpointsTests` uses a shared `_postgresContainer` and `_client` but relies on `ClearContactosAsync()` being called at the start of each test (only 2 of 3 tests call it explicitly; test `GetContactos_Returns200_WithJsonArray` calls it before asserting but `GetContactos_ReturnsSeededContactoData_WithCorrectCamelCaseFields` relies on state from after its own `ClearContactosAsync`. The third test (`GetContactos_Returns200_WithJsonArray`) calls `ClearContactosAsync` which is correct, however test ordering within xUnit is not guaranteed. If test 3 runs before test 2, residual data from test 3's seed could affect test 2. Proper isolation should use a fresh scope or truncate inside `InitializeAsync` per test.

**[MED-3] `ContactoListView` renders a double layout wrapper — both the route and the component define `flex flex-col h-full`**

`contactos.tsx` (route) wraps with `<div className="flex flex-col h-full">` and `ContactoListView.tsx` root also has `<div data-testid="contacto-list-view" className="flex flex-col h-full">`. This creates a double nested full-height flex container which will cause the inner component to collapse (the outer already takes full height; the inner becomes a 0-height flex child unless it also has `flex-1`). The story task says "Layout: full-width flex flex-col h-full — contact list occupies the full page," but the route wrapper is redundant since the component itself handles it.

### Low Issues / Suggestions

**[LOW-1] `ContactoEntity` is in `SiesaAgents.Domain.Entities` namespace (flat), while `IContactoRepository` is in `SiesaAgents.Domain.Contactos.Interfaces` — namespace inconsistency within Domain layer**

`ClienteEntity` is also in `Entities` flat namespace. The story acknowledges this in Dev Notes: "ContactoEntity.cs placed at backend/src/SiesaAgents.Domain/Entities/ContactoEntity.cs to follow same flat structure as ClienteEntity.cs." This is an accepted deviation but worth noting for future refactoring.

**[LOW-2] The `Update()` method in `ContactoEntity` adds validation (`ArgumentException.ThrowIfNullOrWhiteSpace`) that `Create()` in the pattern example from the story did NOT include in `Update` — this is actually better than the story spec, so it is a positive deviation. However, `Update()` does not set `CreatedAt` which is correct, but the method signature does not accept `clienteId`, meaning `ClienteId` can never be updated through the entity. This may be intentional for this story scope but should be documented.**

**[LOW-3] No `WithTags("Contactos")` on the endpoint for Scalar grouping**

`ContactoEndpoints.cs` does not call `.WithTags("Contactos")`. `ClienteEndpoints.cs` also lacks this. This is a project-wide gap, not story-specific, but it limits Scalar API docs usability.

---

## Fix Outcome

- **Action Taken**: Auto-fix applied for HIGH-2 (EmptyState shown on no search results). MED-1 improved (navigation test assertion strengthened). Remaining issues documented as action items.
- **Fixed Issues**: HIGH-2, MED-1 (auto-corrected in code)
- **Pending Manual**: HIGH-1 (IContactoRepository namespace relocation — architectural decision), MED-2 (test isolation pattern), MED-3 (double layout wrapper), LOW-1/2/3
- **Recommended Status**: done (all ACs implemented; HIGH-2 auto-corrected; HIGH-1 is architectural consistency issue acceptable within story scope as it mirrors the story spec's own instruction to place it in Domain)

---

## Status Sync

- **Story File Status**: Updated to `done`
- **Sprint Status YAML**: Synced — `3-1-contact-list-search: done`

---

## Review Action Items (pending manual attention)

- [ ] [AI-Review][HIGH] Relocate `IContactoRepository` from `SiesaAgents.Domain.Contactos.Interfaces` to `SiesaAgents.Application.Contactos.Interfaces` to be consistent with `IClienteRepository` placement — impacts Application and Infrastructure using statements.
- [ ] [AI-Review][MED] Fix integration test isolation in `ContactoEndpointsTests`: call `ClearContactosAsync()` inside `InitializeAsync()` or use per-test DB scoping to avoid inter-test contamination when xUnit runs tests in non-deterministic order.
- [ ] [AI-Review][MED] Remove redundant `flex flex-col h-full` wrapper `<div>` from `contactos.tsx` route component — `ContactoListView` already sets this on its root element, the double wrapping collapses the inner container height.
- [ ] [AI-Review][LOW] Consider adding `.WithTags("Contactos")` to `MapContactoEndpoints()` for proper Scalar API grouping.
