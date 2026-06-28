---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/3-3-create-contact.md
story_key: 3-3-create-contact
date: 2026-06-28
reviewer: SiesaTeam (AI Agent)
status: In Progress
---

# Code Review: 3-3-create-contact

- **Date**: 2026-06-28
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: In Progress

## Initial Discovery

- **Undocumented Changes (in Git but NOT in Story File List)**:
  - `e2e/tests/contactos/contactos-create-edge-cases.spec.ts` — extra E2E tests not listed in story's File List
  - `frontend/src/modules/crm/contactos/__tests__/ContactoDetailView.edge.test.tsx` — Story 3.2 expansion, not in this story's scope
- **Missing Files (in Story File List but NOT in current HEAD diff)**:
  - All 4 story source files were committed in commit `f44c6f9` (partial ATDD), which is part of this story's branch — no false claims
- **Missing Documentation**: Story File List does not include `e2e/tests/contactos/contactos-create-edge-cases.spec.ts`

---

## Review Plan

### Items to Verify
- [x] AC1: "Nuevo contacto" button visible on /contactos route, opens form with 4 required fields
- [x] AC2: POST /api/v1/contactos on submit, contact appears in list (invalidateQueries), toast fires
- [x] AC3: Client-side Zod validation shows inline errors, blocks submission on empty fields
- [x] AC4: Backend 400/409 errors handled without technical detail exposure

### Focus Areas
- Security checks on: `ContactoEndpoints.cs`, `ExceptionHandlingMiddleware.cs`
- Validation consistency: `contactoSchema.ts` vs `CreateContactoRequestValidator.cs`
- WCAG 2.1 AA compliance: `ContactoForm.tsx`, route files (dialog accessibility)
- Test quality: `ContactoForm.test.tsx`, `CreateContactoApiTests.cs`

---

## Review Findings

### Critical Issues (Must Fix)

- **[CRITICAL] Zod schema missing `.trim()` — whitespace-only inputs bypass frontend validation**
  - File: `frontend/src/modules/crm/contactos/application/contactoSchema.ts`
  - `z.string().min(1, ...)` does NOT trim whitespace. A value like `"   "` has `.length === 3`, passes Zod, and is sent to the backend. The backend's `ContactoEntity.Create()` calls `ArgumentException.ThrowIfNullOrWhiteSpace()` which throws, caught by `ExceptionHandlingMiddleware` returning a generic 500 — instead of the expected 400 validation error.
  - Consequence: Edge-case test in `ContactoForm.edge.test.tsx` (line 145) asserts `postCalled = false` for whitespace-only Nombre — this test FAILS in reality because Zod passes the value.
  - FluentValidation's `.NotEmpty()` DOES reject whitespace-only strings (trims internally). The mismatch between Zod and FluentValidation creates inconsistent UX and broken edge tests.
  - Fix: Add `.trim()` to all string fields in `contactoSchema.ts` before `.min(1)`.

### Medium Issues (Should Fix)

- **[MED] Dialog overlay lacks focus trap and Escape key handling — WCAG 2.1 AA violation**
  - Files: `frontend/src/routes/_app/contactos.tsx` (lines 27-37), `frontend/src/routes/_app/contactos.$contactoId.tsx` (lines 33-44)
  - The custom `role="dialog"` div has `aria-modal="true"` and `aria-label` — correct. However, it lacks:
    1. Focus trap (keyboard users can Tab out of the dialog behind the overlay)
    2. Escape key handler to close (`onKeyDown` for `Escape`)
  - WCAG 2.1 AA Success Criterion 2.1.2 (No Keyboard Trap) and ARIA authoring practices for modal dialog pattern require focus to remain inside the dialog and Escape to close it.
  - The story itself references WCAG 2.1 AA compliance as mandatory. Story 2.3 (`ClienteForm`) uses the same pattern — this is a systemic issue in the project.

- **[MED] `aria-describedby` references non-existent DOM elements when no error is present**
  - File: `frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx` (lines 51, 65, 79, 94)
  - Each input has `aria-describedby="error-{field}"` statically. The `<span id="error-{field}">` only renders when there IS an error (`{errors.nombre && ...}`). When no error exists, the referenced id is absent from the DOM — screen readers may announce an empty or broken reference.
  - WCAG 2.1 AA: `aria-describedby` should reference elements that exist in the DOM, or the attribute should be conditionally applied/set to empty string.
  - Fix: Either always render the error span (hidden when no error) or set `aria-describedby` conditionally.

- **[MED] Undocumented files not included in story's File List**
  - File: `_bmad-output/implementation-artifacts/3-3-create-contact.md` (File List section)
  - `e2e/tests/contactos/contactos-create-edge-cases.spec.ts` and `frontend/src/modules/crm/contactos/__tests__/ContactoDetailView.edge.test.tsx` appear in the git branch changes but are NOT listed in the story's "File List" section under "Created" or "Modified". Traceability is broken for these files.

### Low Issues (Nice to Fix)

- **[LOW] `ContactoApiRepository` uses singleton-like export pattern — potential shared state concern**
  - File: `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` (line 23)
  - `export const contactoApiRepository = new ContactoApiRepository()` is a module-singleton. This follows the established project pattern (Story 3.1), but it bypasses the declared `IContactoRepository` interface for DI. In tests, the implementation is mocked at the module level via MSW (intercepting HTTP calls), which works. However, this pattern makes it impossible to swap repository implementations without patching the module import.
  - Not blocking for this story's scope — consistent with Story 3.1 pattern.

- **[LOW] Missing `type="email"` autocomplete attribute on telefono input**
  - File: `frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx` (line 76)
  - The `telefono` input lacks `type="tel"` and `inputMode="numeric"` / `autocomplete="tel"`. Using the default `type="text"` means mobile users don't get the numeric keyboard. Minor UX issue. The story spec does not explicitly require it.

- **[LOW] Backend `POST /api/v1/contactos` does not sanitize trimmed whitespace at endpoint level**
  - File: `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` (lines 35-62)
  - `ContactoEntity.Create()` does `.Trim()` on all fields (good). However, FluentValidation runs BEFORE `Create()`, and `NotEmpty()` rejects whitespace-only values. So whitespace from a valid-looking `"  Juan  "` input will be trimmed to `"Juan"` in the entity. This is actually correct behavior, but the `ContactoDto` returned reflects the trimmed value while the client sent an un-trimmed value. This is expected behavior but should be documented.

---

## Fix Outcome
- **Action Taken**: Auto-fix applied for CRITICAL + 1 MED issue
- **Fixed Count**: 2 (contactoSchema.ts .trim() fix, ContactoForm.tsx aria-describedby fix)
- **Issues Requiring Manual Attention**: 1 (MED — dialog focus trap/Escape key) + 2 (LOW)
- **Recommended Status**: PASS CON OBSERVACIONES

## Status Sync
- **Story File Status**: Updated to done
- **Sprint Status YAML**: Synced — 3-3-create-contact → done
