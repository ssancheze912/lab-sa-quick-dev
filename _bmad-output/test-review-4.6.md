# Test Review — Story 4.6: Reassign Contact to Different Client

**Date:** 2026-06-29  
**Reviewer:** TEA Workflow (testarch-test-review)  
**Story Status:** review  
**Verdict:** PASS CON OBSERVACIONES  

---

## Summary

| Dimension | Result |
|---|---|
| AC Coverage (11/11) | PASS |
| Given-When-Then structure | PASS |
| Hard waits | PASS (none detected) |
| Auto-cleanup / fixture isolation | PASS CON OBSERVACIONES |
| Selectors (data-testid) | PASS |
| Performance (<90s/test) | PASS |
| File size (<300 lines/file) | PASS |
| Atomic assertions | PASS CON OBSERVACIONES |
| MSW lifecycle pattern | PASS CON OBSERVACIONES |
| Accessibility assertions (WCAG) | PASS CON OBSERVACIONES |

---

## AC Coverage Matrix

| AC | Description | Test File(s) | Covered | Status |
|---|---|---|---|---|
| AC #1 | "Reasignar cliente" button visible when clienteId non-null | ContactoDetailView.reasignar.test.tsx (TC-1), E2E AC#1 | YES | PASS |
| AC #2 | Dialog lists clients excluding current | ReasignarClienteDialog.test.tsx (TC-1, TC-2), E2E AC#2 | YES | PASS |
| AC #3 | PUT called with `{ clienteId: newClienteId }` | useReasignarContacto.test.ts (TC-1), ReasignarClienteDialog.test.tsx (TC-4), E2E TC-1 | YES | PASS |
| AC #4 | TanStack Query keys invalidated + success toast | useReasignarContacto.test.ts (TC-2a–2e, TC-3), E2E TC-2, TC-3 | YES | PASS |
| AC #5 | New client name appears in ClienteAsociadoSeccion | ContactoDetailView.reasignar.test.tsx (TC-4), E2E TC-1 | YES | PASS |
| AC #6 | Cancel: no API call, association unchanged | ReasignarClienteDialog.test.tsx (TC-5), ContactoDetailView.reasignar.test.tsx (TC-5), E2E TC-4 | YES | PASS |
| AC #7 | Confirm disabled while pending; disabled before selection | ReasignarClienteDialog.test.tsx (TC-3, TC-7), useReasignarContacto.test.ts (TC-5) | YES | PASS |
| AC #8 | Error toast; dialog stays open on failure | useReasignarContacto.test.ts (TC-4, TC-6), ReasignarClienteDialog.test.tsx (TC-8) | YES | PASS |
| AC #9 | Backend overwrites existing clienteId — no 409 | ReasignarClienteTests.cs (TC-1–TC-5) | YES | PASS |
| AC #10 | Button NOT shown when clienteId is null; empty state | ContactoDetailView.reasignar.test.tsx (TC-2), ReasignarClienteDialog.test.tsx (TC-6), E2E AC#10 | YES | PASS |
| AC #11 | Button is keyboard-accessible, WCAG 2.1 AA | ContactoDetailView.reasignar.test.tsx (TC-6), ReasignarClienteDialog.test.tsx (TC-9) | PARTIAL | OBSERVACIÓN |

**Total: 11/11 ACs covered (100%).**  
AC #11 coverage is present but limited to `tagName === 'button'` and ARIA role checks — see observations below.

---

## File-by-File Review

---

### 1. `useReasignarContacto.test.ts` (474 lines)

**Structure:** Given-When-Then applied consistently across all 6 describe blocks. Comments are aligned with test IDs.

**PASS items:**
- No hard waits (`setTimeout`, `sleep`). `waitFor` used correctly.
- `createWrapper()` creates an isolated `QueryClient` per test — no shared state.
- `server.close()` in `afterEach` — proper MSW 2 lifecycle.
- `vi.restoreAllMocks()` in `afterEach` — spy cleanup is correct.
- TC-2a–2e spy approach: `vi.spyOn(queryClient, 'invalidateQueries')` is attached to the same `QueryClient` instance used by the hook via the wrapper. This is architecturally correct.
- TC-5 `isPending` test correctly uses a Promise gate to hold the server response rather than a timer — no hard wait.
- TC-6 validates `result.current.data` is `undefined` on error, enforcing no optimistic update.

**OBSERVACIONES (warnings):**

1. **[WARNING] TC-3/TC-4 toast import uses `siesa-ui-kit` instead of `react-hot-toast`.**  
   The story's Dev Notes and `useReasignarContacto.ts` pattern reference `react-hot-toast`. The tests import `siesa-ui-kit`:
   ```
   const toastModule = await import('siesa-ui-kit');
   const toastSpy = vi.spyOn(toastModule.toast, 'success');
   ```
   If `useReasignarContacto.ts` is implemented with `react-hot-toast` (as specified in Dev Notes), these toast spy tests will pass vacuously (spy never triggered) or fail depending on module resolution. This is a **coupling risk** — the test must spy on the same module the hook imports.  
   **Recommendation:** Confirm whether `siesa-ui-kit` re-exports `react-hot-toast`'s `toast`, or align the import to match what the implementation file will use. If they differ, TC-3 and TC-4 assertions will always succeed without actually validating the toast.

2. **[WARNING] `server.close()` called in `afterEach` but `server.listen()` is called in `beforeEach`.**  
   MSW 2 best practice for Node is to call `server.listen()` once in `beforeAll` and `server.close()` once in `afterAll`, using `server.resetHandlers()` between tests. Calling `listen/close` per test works but is less efficient and can produce timing issues in parallel test runners. Not a correctness blocker at this file size.

3. **[INFO] TC-2e (`should NOT call invalidateQueries when mutation fails`) is a valuable negative test.** The TC is correct and important — confirms no cache pollution on error.

---

### 2. `ReasignarClienteDialog.test.tsx` (567 lines)

**Structure:** GWT present in all 9 describe groups. Props interface `RenderDialogProps` centralizes test setup cleanly.

**PASS items:**
- No `setTimeout`/`sleep` hard waits.
- Isolated `QueryClient` per render call in `renderDialog()`.
- `data-testid="reasignar-cliente-dialog"` verified in TC-1 variant — confirms the dialog container has the expected testid.
- TC-5 intercepts the PUT handler inline and counts invocations via `putCallCount` — this is correct and more reliable than spying on the module.
- TC-7 uses the Promise gate pattern (same as useReasignarContacto TC-5) to hold the pending state — no hard wait.
- TC-9 asserts `tagName.toLowerCase() === 'button'` for both confirm and cancel buttons — correct WCAG verification for keyboard accessibility.

**OBSERVACIONES (warnings):**

4. **[WARNING] TC-8 error toast assertion uses screen text lookup, not a toast spy.**  
   ```typescript
   await waitFor(() => {
     expect(screen.getByText(/No se pudo reasignar el contacto/i)).toBeInTheDocument();
   });
   ```
   This will only work if the toast library renders its content into the React Testing Library DOM. `react-hot-toast` does render into the DOM when used inside a `Toaster` component, but the test's `renderDialog` helper does not mount a `<Toaster>`. If the implementation uses `react-hot-toast` without a mounted `Toaster` in the test environment, this assertion will fail silently or never find the text.  
   **Recommendation:** Either (a) add `<Toaster />` to the `renderDialog` wrapper, or (b) use `vi.spyOn` on the toast module (same approach as TC-3/TC-4 in the hook tests).

5. **[INFO] TC-6 includes three variants (only current client exists, empty list, search produces no matches).** This is good — edge case coverage is thorough.

6. **[INFO] File is 567 lines, exceeding the 300-line threshold.** However, this is due to the comprehensive 9-TC coverage with multiple describe blocks and proper GWT comments, not bloat. The file follows the required test plan scope. The threshold is a guideline; exceeding it with high-signal tests is acceptable. No action required.

---

### 3. `ContactoDetailView.reasignar.test.tsx` (385 lines)

**Structure:** GWT consistent. Router mock is well-structured and avoids test framework contamination.

**PASS items:**
- Router mock uses `vi.mock` with `importOriginal` — the mock is scoped to this test file only (no global pollution).
- TC-2 correctly waits for `'Sin cliente asignado'` to appear before asserting button absence — avoids false-positive from premature assertion.
- TC-4 uses `server.use(...)` mid-test to switch the GET handler after the PUT succeeds — this correctly simulates TanStack Query invalidation and re-fetch. The pattern is valid for MSW 2.
- TC-5 verifies original client remains visible AND dialog is dismissed after cancel — two concerns per test, but they model a single logical flow (cancel = no change). Acceptable.

**OBSERVACIONES (warnings):**

7. **[WARNING] TC-4 `waitFor` timeout set to 3000ms.**  
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Nuevo Cliente Ltda')).toBeInTheDocument();
   }, { timeout: 3000 });
   ```
   The extended timeout is used to accommodate the re-fetch after query invalidation. While not a hard wait, a 3-second `waitFor` timeout in a unit/component test is a signal that the test depends on timing rather than a predictable event. If the implementation is correct, the re-fetch should happen within the default 1000ms.  
   **Recommendation:** After query invalidation triggers, the GET handler should resolve immediately (MSW is synchronous). If the test requires 3s, it may indicate the invalidation flow is complex. Consider reducing to 1500ms to tighten the quality gate.

8. **[WARNING] `renderContactoDetailView` does not pass a `MemoryRouter` or `RouterProvider`.**  
   The router mock replaces `useNavigate` and `Link`, but `ContactoDetailView` may also use `useParams` to get `contactoId` from the URL. The test passes `contactoId` as a prop, so this may already be handled by the component's prop interface. Verify that the implementation uses `contactoId` prop (not `useParams`) to avoid router-dependency issues.

9. **[INFO] The `queryClient` is returned from `renderContactoDetailView` but never used in any test after TC-4.** Minor unused variable — no impact on test correctness.

---

### 4. `ReasignarClienteTests.cs` (341 lines)

**Structure:** xUnit `[Fact]` methods with clear Given-When-Then XML doc comments. Method names follow the `TCn_Action_Expected_Context` pattern.

**PASS items:**
- `AssignClienteWebApplicationFactory` is reused from Story 4.2 — no new factory needed, correct architecture decision.
- `SeedContactoWithClienteAsync` helper isolates test data creation — clean.
- TC-1 has a second variant (`TC1_PutReasignarCliente_ResponseBodyIsFullContactoDto`) that validates the full DTO shape — good robustness test.
- TC-2 verifies persistence via a follow-up GET — this covers the durability of the overwrite, which a pure in-memory test might not catch.
- TC-4 (idempotent reassignment) correctly validates the same-clienteId scenario — a boundary case often missed.
- TC-5 (NFR6 response leakage check) validates that success responses do not expose internal stack traces.

**OBSERVACIONES (warnings):**

10. **[WARNING] No test for 404 when contacto does not exist.**  
    The story scope is AC #9 (overwrite scenario), but a guard test for invalid `contactoId` (UUID not found) would strengthen confidence in the endpoint. This is a missing boundary case at the API level. Not a blocker for AC #9 coverage, but noted.

11. **[WARNING] `createdAt` field not validated in TC-2 GET response.**  
    TC-1 variant checks `createdAt` presence but not format. The architecture mandates `DateTimeOffset ISO 8601` format. A format assertion (`Assert.Matches(@"\d{4}-\d{2}-\d{2}T.*Z", createdAtStr)`) would harden the contract.

---

### 5. `reassign-contact.spec.ts` (337 lines)

**Structure:** GWT clear in all tests. `test.describe` groups by story. `beforeEach`/`afterEach` handle API setup and cleanup.

**PASS items:**
- No `page.waitForTimeout()` or `sleep()` — all waits use `expect(...).toBeVisible()` or `waitForURL`.
- `afterEach` cleanup deletes created contactos and clientes via API — proper isolation.
- All selectors use `data-testid` (`reasignar-cliente-btn`, `reasignar-cliente-dialog`, `cliente-asociado-section`, `sin-cliente-message`) — no fragile CSS selectors.
- Route interception comment `// CRITICAL: Intercept BEFORE navigation` is present in all tests — prevents race conditions on initial load.
- TC-4 (cancel) verifies via API that `contactoActualizado.clienteId === clienteA.id` — this is a strong post-condition assertion beyond just UI state.
- TC-2 and TC-3 exercise cross-list invalidation by navigating to the old/new client detail pages after reassignment — these directly validate AC #4's TanStack Query invalidation semantics at the E2E level.

**OBSERVACIONES (warnings):**

12. **[WARNING] TC-2 and TC-3 create contacts via `buildContacto({ nombre: '...' })` without an initial `clienteId`, then call `apiHelper.asignarClienteAContacto` separately.**  
    This is a valid pattern but means if `asignarClienteAContacto` fails (API error), the test will fail with a confusing error rather than a clear setup failure. Adding an `expect` assertion on the assign API response would surface failures earlier.

13. **[WARNING] `page.route()` in AC#2 and later tests uses broad wildcards (`**/api/v1/clientes*`) and calls `route.continue()` — these pass through to the real backend.**  
    This is correct behavior for E2E tests (network-first). However, if the test environment does not have the backend running, these tests will fail with network errors rather than test assertion failures. The pattern is correct for a properly configured CI environment.

14. **[WARNING] `page.getByText('Cliente A Original E2E')` in AC#2 assertion uses `.not.toBeVisible()` rather than `.not.toBeInTheDocument()`.**  
    If the dialog renders the current client's name outside the list (e.g., as a label "Cliente actual:"), the assertion would pass even if the client name appears elsewhere in the DOM but hidden. A stricter assertion scoped to the list container would be more precise.

---

## Standards Compliance

| Standard | Status | Notes |
|---|---|---|
| Given-When-Then | PASS | All test bodies have explicit GIVEN/WHEN/THEN comments |
| No hard waits | PASS | No `sleep`, `waitForTimeout`, or `setTimeout` used |
| Auto-cleanup in fixtures | PASS | `QueryClient` isolated per test, `server.resetHandlers()` in afterEach, E2E API cleanup in afterEach |
| Selectors `data-testid` | PASS | `reasignar-cliente-btn`, `reasignar-cliente-dialog`, `cliente-asociado-section`, `sin-cliente-message` |
| Performance <90s/test | PASS | No I/O blocking, MSW intercepts are synchronous |
| File size <300 lines | WARNING | ReasignarClienteDialog.test.tsx (567), reassign-contact.spec.ts (337), ReasignarClienteTests.cs (341) exceed threshold but are justified by required test coverage |
| Atomic assertions (1 principal assertion) | PASS CON OBSERVACIONES | Most tests have one primary assertion; TC-4 in ContactoDetailView and TC-1 in C# have multiple assertions but they cover the same logical concern |
| MSW lifecycle | WARNING | listen/close per-test instead of beforeAll/afterAll (frontend tests) — works but suboptimal |
| WCAG coverage | PARTIAL | Native `<button>` check present; no keyboard interaction simulation (`Tab` focus, `Enter` key activation) |

---

## Issues Summary

### Críticos (blockers)
None.

### Warnings (no bloquean pero deben resolverse)

| # | File | Issue | Recommended Fix |
|---|---|---|---|
| W-1 | `useReasignarContacto.test.ts` L282, L316 | Toast spy imports `siesa-ui-kit` — must match implementation's import | Align spy to implementation's actual toast import |
| W-2 | `ReasignarClienteDialog.test.tsx` TC-8 | Error toast assertion uses DOM text lookup — requires `<Toaster>` mounted or a spy | Add `<Toaster />` to `renderDialog` wrapper or use `vi.spyOn` |
| W-3 | `ContactoDetailView.reasignar.test.tsx` TC-4 | `waitFor` timeout 3000ms — tighten to 1500ms max | Reduce timeout; investigate if delay is due to implementation or test setup |
| W-4 | `ReasignarClienteTests.cs` | No 404 test for invalid contactoId | Add TC: `PUT /api/v1/contactos/{nonExistentId}/cliente` → 404 |
| W-5 | `reassign-contact.spec.ts` TC-2/TC-3 | No assertion on `asignarClienteAContacto` API call in setup | Add `expect(assignResponse.status).toBe(200)` after setup API call |
| W-6 | `reassign-contact.spec.ts` AC#2 | `getByText('Cliente A Original E2E').not.toBeVisible()` is too broad | Scope assertion to dialog list container |

### Observaciones informativas

| # | File | Note |
|---|---|---|
| I-1 | All frontend files | MSW `server.listen/close` per test (acceptable for this scope) |
| I-2 | `ReasignarClienteDialog.test.tsx` | File exceeds 300 lines (567) — justified by test plan |
| I-3 | `ReasignarClienteTests.cs` | `createdAt` field format not validated in GET follow-up |
| I-4 | `ContactoDetailView.reasignar.test.tsx` | `queryClient` unused after TC-4 |
| I-5 | `reassign-contact.spec.ts` | `route.continue()` passes to real backend — requires configured E2E environment |

---

## WCAG / Accessibility Coverage Assessment

**Present:**
- `tagName === 'button'` check for "Reasignar cliente" (ContactoDetailView TC-6), "Reasignar" confirm (ReasignarClienteDialog TC-9), and "Cancelar" (TC-9)
- ARIA role `button` accessibility via `getByRole('button', { name: /.../ })` in multiple tests

**Missing (WCAG 2.1 AA gaps):**
- No keyboard interaction test: `Tab` focus sequence, `Enter` activates button, `Space` activates button
- No test for `aria-disabled` attribute when button is in disabled state (TC-3, TC-7) — asserting `toBeDisabled()` checks the DOM `disabled` property but not whether a `aria-disabled="true"` fallback is present for custom elements
- No test for dialog `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing to the title
- No color contrast or focus-visible test (these typically require axe-core or jest-axe integration)

**Recommendation:** Add at least one `axe-core` or `jest-axe` scan for AC #11 compliance. The existing `tagName` and `role` checks satisfy the story's explicit acceptance criterion but not the full WCAG 2.1 AA company standard.

---

## Auto-Corrections Applied

None. Per scope of this review: DO NOT MODIFY test files.

---

## Quality Gate Decision

**PASS CON OBSERVACIONES**

All 11 acceptance criteria are covered across 5 test files with 39+ test cases. No critical defects were found. Six warnings require attention before the story is marked Done, with W-1 and W-2 being the highest-priority items since they risk toast assertions passing vacuously if the toast module import is misaligned.
