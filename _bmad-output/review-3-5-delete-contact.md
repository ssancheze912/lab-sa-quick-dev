---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7]
story_path: _bmad-output/implementation-artifacts/3-5-delete-contact.md
story_key: 3-5-delete-contact
---

# Code Review: 3-5-delete-contact

- **Date**: 2026-06-28
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: In Progress

## Initial Discovery

- **Undocumented Changes**: None — all git-changed files are documented in the story File List.
- **Missing Files**: `frontend/src/modules/crm/contactos/__tests__/DeleteContacto.test.tsx` listed in the story File List as part of the implementation commit (`43c5748`) but not explicitly listed as "Created" in the Dev Agent Record; present on disk and correct.
- **Extra Test Files Added** (automation expansion, expected): `DeleteContactoApiEdgeTests.cs`, `contactos-delete.spec.ts`, `contactos-delete-edge-cases.spec.ts`, `DeleteContacto.edge.test.tsx`, `contactos-delete.api.spec.ts`.

---

## Review Plan

### Items to Verify

- [x] AC1: Clicking "Eliminar" shows AlertDialog with "¿Eliminar este contacto?", "Confirmar", "Cancelar"
- [x] AC2: Confirming triggers DELETE /api/v1/contactos/:id → contact removed from list, navigate to /contactos, toast "Contacto eliminado correctamente"
- [x] AC3: Cancelling closes dialog, no DELETE call made
- [x] Task 1: Backend DELETE endpoint (204/404 + Problem Details)
- [x] Task 2: useDeleteContacto mutation hook with invalidateQueries
- [x] Task 3: AlertDialog in ContactoDetailView
- [x] Task 4: onContactoDeleted navigate wiring in route
- [x] Task 5: Tests coverage aligned with test-design-epic-3.md

### Focus Areas

- Repository responsibility inconsistency: `DeleteAsync` vs `UpdateAsync` — who owns `SaveChangesAsync`?
- Unit Test misclassification: `WebApplicationFactory<Program>` in `SiesaAgents.UnitTests` project
- Missing `GetContactosQueryHandler` DI registration in Program.cs
- `contactoApiRepository` singleton pattern vs class interface
- AlertDialog positioning: rendered outside data-guard scope

---

## Review Findings

### Critical Issues (Must Fix)

*No CRITICAL issues found (no implemented ACs missing, no false claims in story).*

### High Issues (Must Fix)

*No HIGH issues found after verification — all ACs are implemented, all DI registrations present.*

---

### Medium Issues (Should Fix)

**[MED-1] Repository responsibility inconsistency: `DeleteAsync` owns its own `SaveChangesAsync` but `UpdateAsync` does not**

`ContactoRepository.DeleteAsync` (lines 33-37) calls `SaveChangesAsync` internally, making the handler self-contained. But `UpdateAsync` (lines 39-42) does NOT call `SaveChangesAsync` — it's the handler (`UpdateContactoCommandHandler`, lines 15-16) that must explicitly call `repository.SaveChangesAsync(ct)`. This asymmetry is architecturally inconsistent within the same repository.

For contrast, in `ClienteRepository`: `UpdateAsync` calls `SaveChangesAsync` internally (like Delete does here), and `ClienteRepository.DeleteAsync` also calls it internally. The Contacto pattern is hybrid — Delete buries `SaveChangesAsync` inside the repo method while Update surfaces it to the handler.

The consequence: if a future developer adds a new command handler that calls `DeleteAsync` they will NOT call `SaveChangesAsync` separately (because it's internal). But if they call `UpdateAsync` they MUST call it or changes will not persist. This inconsistency is a bug-farm.

*Files:* `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` lines 33-42
*Fix:* Align both methods — either both call `SaveChangesAsync` internally (Client pattern), or neither does (caller responsibility). Recommend making `DeleteAsync` NOT call `SaveChangesAsync` internally and adding `await repository.SaveChangesAsync(ct);` to `DeleteContactoCommandHandler.HandleAsync` (to match UpdateContactoCommandHandler pattern).

**[MED-2] Integration tests placed in `SiesaAgents.UnitTests` project (test type misclassification)**

`DeleteContactoApiTests.cs` and `DeleteContactoApiEdgeTests.cs` both use `WebApplicationFactory<Program>` — this spins up the full ASP.NET Core pipeline against a live (or in-memory) database. These are integration tests, not unit tests. They reside in `backend/tests/SiesaAgents.UnitTests/Contactos/` which is semantically incorrect per company standards and standard .NET project organization (`{Domain}.UnitTests` vs `{Domain}.IntegrationTests`).

*Files:* `backend/tests/SiesaAgents.UnitTests/Contactos/DeleteContactoApiTests.cs`, `backend/tests/SiesaAgents.UnitTests/Contactos/DeleteContactoApiEdgeTests.cs`
*Note:* This is a pre-existing pattern across all Epic stories (the `SiesaAgents.IntegrationTests` project was never created). Not introduced by this story, but worth calling out. Recommend creating `SiesaAgents.IntegrationTests` project and moving all `WebApplicationFactory`-based tests there.

**[MED-3] `contactoApiRepository` exported as a module-level singleton, bypassing DI and the `IContactoRepository` interface**

`contactoApiRepository.ts` exports a singleton: `export const contactoApiRepository = new ContactoApiRepository();` (line 32). The hook `useDeleteContacto.ts` imports this directly (line 2), hardcoding the concrete implementation and making unit testing without MSW impossible. The domain interface `IContactoRepository` exists (line 9 in `IContactoRepository.ts`) but is never injected — it's purely a structural type hint.

Per Clean Architecture standards, the application layer (hooks) should depend on the domain interface, not the concrete infrastructure implementation. This pattern has been pre-existing since Story 3.1 but is perpetuated here.

*Files:* `frontend/src/modules/crm/contactos/application/useDeleteContacto.ts` line 2, `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` line 32.
*Fix:* Export a factory or use React context injection so tests can swap implementations. MSW mitigates this in tests, but the architecture violates DI principles.

---

### Low Issues (Nice to Fix / Informational)

**[LOW-1] `AlertDialog` is rendered outside the data-loaded guard block in JSX**

`ContactoDetailView.tsx` renders the `AlertDialog` component (lines 129-148) outside the `if (!data) return null` guard (line 76). While this works because `isDeleteDialogOpen` defaults to `false` and the `open` prop on `AlertDialog` controls visibility, the component's mutation state (`deleteMutation`) and the dialog are still instantiated during loading/error states. This is harmless but semantically inconsistent — the "Eliminar" button is guarded but the dialog rendering is not.

*File:* `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx` lines 76-148.
*Impact:* None in practice. Cosmetic/architectural.

**[LOW-2] Test file `DeleteContacto.test.tsx` not listed in story Dev Agent Record File List**

The story's Dev Agent Record lists the **created** files as only 4 files, but `frontend/src/modules/crm/contactos/__tests__/DeleteContacto.test.tsx` is present on disk and is part of the ATDD tests (referenced in the story Tasks section). The Dev Agent Completion Notes mention this file passes GREEN. It should appear in the "Created" file list.

*File:* `_bmad-output/implementation-artifacts/3-5-delete-contact.md` — Dev Agent Record → File List
*Impact:* Documentation gap only.

**[LOW-3] `DeleteContactoApiTests.cs` uses `DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()` for unique email suffix but no cleanup between tests**

Tests `DeleteContacto_WithValidId_Returns204NoContent` and `DeleteContacto_ContactRemovedFromList_AfterDeletion` create contacts with time-based unique email suffixes but the factory-based `WebApplicationFactory<Program>` shares the same database across all tests in the class fixture. If tests run in parallel or very quickly, suffix collision could cause `409 Conflict` on POST (unique email constraint). The test setup calls `MigrateAsync` in only one test (line 46), not consistently across tests.

*File:* `backend/tests/SiesaAgents.UnitTests/Contactos/DeleteContactoApiTests.cs` lines 48-52.
*Impact:* Flakiness risk in CI under parallel test execution.

---

## Acceptance Criteria Verification

| AC | Description | Status | Evidence |
|----|-------------|--------|---------|
| AC1 | Clicking "Eliminar" → AlertDialog with "¿Eliminar este contacto?", "Confirmar", "Cancelar" | PASS | `ContactoDetailView.tsx` lines 104-112, 129-148; TC-E3-3-5-CMP-1 tests present |
| AC2 | Confirming → DELETE /api/v1/contactos/:id → removed from list, navigate to /contactos, toast | PASS | Endpoint 204 (lines 95-108 `ContactoEndpoints.cs`); `useDeleteContacto` invalidateQueries; route wired `onContactoDeleted` |
| AC3 | Cancelling → dialog closes, no DELETE called | PASS | `AlertDialogCancel` handler (line 138); TC-E3-3-5-CMP-2 tests present |

---

## Company Standards Compliance

| Standard | Status | Notes |
|---------|--------|-------|
| UUID PKs (Guid) | PASS | `ContactoEntity.Id` is `Guid`, `DeleteContactoCommand(Guid Id)` |
| DateTimeOffset (no DateTime) | PASS | `ContactoEntity` uses `DateTimeOffset CreatedAt/UpdatedAt` |
| FluentValidation | PASS (N/A) | Story correctly notes no FluentValidation needed (ID from route only) |
| Problem Details RFC 7807 | PASS | `Results.Problem(...)` used (not `Results.NotFound()`) |
| Minimal API (no controllers) | PASS | `ContactoEndpoints.cs` uses `MapDelete` |
| EF Core `ApplySnakeCaseNaming` | PASS | `Program.cs` line 24 `.UseSnakeCaseNamingConvention()` |
| Scalar API reference | PASS | `app.MapScalarApiReference()` (no Swagger) |
| TanStack Query mutations | PASS | `useMutation` with `invalidateQueries` |
| Spanish user-facing text | PASS | All dialog text, toast, button labels in Spanish |
| Code in English | PASS | Variables/functions in English |
| No `any` TypeScript | PASS | No `any` found in new files |
| Clean Architecture layers | PASS | Domain/Application/Infrastructure/Presentation properly separated |
| WCAG 2.1 AA | PASS | `aria-label="Eliminar contacto"` on button |

---

## Fix Outcome

- **[MED-1] DeleteAsync/UpdateAsync SaveChangesAsync inconsistency**: AUTO-CORRECTED — `ContactoRepository.DeleteAsync` now only removes entity (no internal SaveChangesAsync), `DeleteContactoCommandHandler` now explicitly calls `repository.SaveChangesAsync(ct)` to match `UpdateContactoCommandHandler` pattern.
- **[MED-2] Integration tests in UnitTests project**: PENDING MANUAL — requires project restructuring (out of story scope, pre-existing pattern).
- **[MED-3] Singleton repository pattern**: PENDING MANUAL — pre-existing architectural debt across all Epic stories.
- **[LOW-1] AlertDialog outside guard**: INFORMATIONAL — no fix applied, no runtime risk.
- **[LOW-2] Missing file in Dev Agent Record**: AUTO-CORRECTED — added `DeleteContacto.test.tsx` to "Created" file list.
- **[LOW-3] Test flakiness risk**: INFORMATIONAL — no fix applied.

- **Fixed Count**: 2 auto-corrected
- **Pending Manual**: 2 (MED-2, MED-3 — pre-existing technical debt, out of story scope)
- **Recommended Status**: done

## Status Sync

- **Story File Status**: Updated to done
- **Sprint Status YAML**: Synced — 3-5-delete-contact → done

## Repository Sync
- **Branch**: claude/bold-wright-fb88cb
- **Commit**: f2a531a — review(epic-3/story-3.5): PASS — auto-fix SaveChangesAsync consistency
- **Push**: Performed — origin/claude/bold-wright-fb88cb
- **GitFlow Compliance**: Verified against _bmad/bmm/data/git-flow-siesa.md
- **Status**: Workflow Completed Successfully
