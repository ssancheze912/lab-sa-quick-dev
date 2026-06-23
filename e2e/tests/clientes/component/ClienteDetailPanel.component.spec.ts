/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Component Level — Vitest + RTL + MSW)
 * These tests define expected component behavior BEFORE implementation.
 * They are NOT runnable with Playwright — they serve as the specification
 * for the Vitest+RTL component tests that must be created at:
 *   frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx
 *   frontend/src/modules/crm/clientes/application/useCliente.test.ts
 *
 * Acceptance Criteria covered:
 *   AC1 — ClienteDetailPanel renders fields: Nombre, NIT/RUC, Teléfono, Ciudad on success
 *   AC3 — "Cliente no encontrado." message when hook returns 404 error
 *   AC4 — Skeleton placeholders (react-loading-skeleton) while isLoading, NOT a spinner
 *   AC5 — ErrorPanel + "Reintentar" button on non-404 error; click re-triggers query
 *   AC6 — DefaultDetailPlaceholder when clienteId prop is undefined
 *   AC9 — h2 heading with client Nombre; definition list (<dl>/<dt>/<dd>) for fields
 *
 * IMPORTANT: These test descriptions serve as RED-phase specifications.
 * The dev team must implement the following Vitest+RTL tests to satisfy them.
 *
 * Required MSW handler: GET /api/v1/clientes/:id
 * Required test setup:
 *   - QueryClientProvider wrapping component
 *   - MSW server with handlers for /api/v1/clientes/:id
 *   - @testing-library/user-event for interactions
 *   - @testing-library/react for render + queries
 *   - vitest for test runner and spies
 */

// ─────────────────────────────────────────────────────────────────────────────
// SPECIFICATION: ClienteDetailPanel Component Tests (Vitest + RTL + MSW)
//
// File to create: frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TEST SPEC: AC6 — DefaultDetailPlaceholder when clienteId is undefined
 *
 * describe('ClienteDetailPanel — No client selected (undefined clienteId)', () => {
 *   test('should render DefaultDetailPlaceholder when clienteId prop is undefined', async () => {
 *     // GIVEN: ClienteDetailPanel is rendered without a clienteId
 *     render(<ClienteDetailPanel clienteId={undefined} />, { wrapper });
 *
 *     // THEN: The placeholder text is shown
 *     expect(screen.getByText(/selecciona un cliente de la lista/i)).toBeInTheDocument();
 *     // AND: No skeleton, no error, no detail fields are shown
 *     expect(document.querySelector('.react-loading-skeleton')).not.toBeInTheDocument();
 *     expect(screen.queryByTestId('cliente-detail-nit')).not.toBeInTheDocument();
 *   });
 * });
 */

/**
 * TEST SPEC: AC4 — Skeleton loading state while isLoading === true
 *
 * describe('ClienteDetailPanel — Loading state', () => {
 *   test('should render skeleton placeholders (not spinner) while API request is in flight', async () => {
 *     // GIVEN: MSW delays response to GET /api/v1/clientes/:id by 500ms
 *     server.use(
 *       http.get('/api/v1/clientes/:id', async () => {
 *         await delay(500);
 *         return HttpResponse.json(clienteFixture);
 *       })
 *     );
 *
 *     // WHEN: ClienteDetailPanel is rendered with a clienteId before response resolves
 *     render(<ClienteDetailPanel clienteId="some-valid-id" />, { wrapper });
 *
 *     // THEN: Skeleton elements are visible (react-loading-skeleton)
 *     expect(document.querySelector('.react-loading-skeleton')).toBeInTheDocument();
 *     // AND: No spinner is rendered
 *     expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
 *     // AND: No detail fields yet
 *     expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument();
 *   });
 * });
 */

/**
 * TEST SPEC: AC5 — ErrorPanel with Reintentar on non-404 error
 *
 * describe('ClienteDetailPanel — Error state (non-404)', () => {
 *   test('should render ErrorPanel with Reintentar button when GET /api/v1/clientes/:id returns 500', async () => {
 *     // GIVEN: MSW returns 500 for the detail endpoint
 *     server.use(
 *       http.get('/api/v1/clientes/:id', () => new HttpResponse(null, { status: 500 }))
 *     );
 *
 *     // WHEN: ClienteDetailPanel renders and query fails
 *     render(<ClienteDetailPanel clienteId="some-id" />, { wrapper });
 *     await waitFor(() => expect(screen.getByTestId('cliente-detail-error')).toBeInTheDocument());
 *
 *     // THEN: ErrorPanel is visible
 *     expect(screen.getByTestId('cliente-detail-error')).toBeInTheDocument();
 *     // AND: Reintentar button is present
 *     expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
 *     // AND: No detail fields or placeholder
 *     expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument();
 *   });
 *
 *   test('should re-trigger the query when "Reintentar" button is clicked', async () => {
 *     // GIVEN: MSW initially returns 500, then succeeds on second call
 *     let callCount = 0;
 *     server.use(
 *       http.get('/api/v1/clientes/:id', () => {
 *         callCount++;
 *         if (callCount === 1) return new HttpResponse(null, { status: 500 });
 *         return HttpResponse.json(clienteAlphaFixture);
 *       })
 *     );
 *
 *     // WHEN: Error panel shows and Reintentar is clicked
 *     render(<ClienteDetailPanel clienteId="some-id" />, { wrapper });
 *     await waitFor(() => expect(screen.getByTestId('cliente-detail-error')).toBeInTheDocument());
 *     await userEvent.click(screen.getByRole('button', { name: /reintentar/i }));
 *
 *     // THEN: Detail fields render after retry
 *     await waitFor(() => expect(screen.getByTestId('cliente-detail-nombre')).toBeInTheDocument());
 *     expect(callCount).toBeGreaterThanOrEqual(2);
 *   });
 * });
 */

/**
 * TEST SPEC: AC3 — Not-found message when GET returns 404
 *
 * describe('ClienteDetailPanel — Not-found state (404)', () => {
 *   test('should render not-found message "Cliente no encontrado." when API returns 404', async () => {
 *     // GIVEN: MSW returns 404 for the detail endpoint
 *     server.use(
 *       http.get('/api/v1/clientes/:id', () =>
 *         HttpResponse.json(
 *           { title: 'Cliente no encontrado.', status: 404 },
 *           { status: 404 }
 *         )
 *       )
 *     );
 *
 *     // WHEN: ClienteDetailPanel renders with non-existent clienteId
 *     render(<ClienteDetailPanel clienteId="nonexistent-id" />, { wrapper });
 *     await waitFor(() => expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument());
 *
 *     // THEN: The not-found message is visible
 *     expect(screen.getByText('Cliente no encontrado.')).toBeInTheDocument();
 *     // AND: No ErrorPanel (404 is expected, not a generic error)
 *     expect(screen.queryByTestId('cliente-detail-error')).not.toBeInTheDocument();
 *   });
 * });
 */

/**
 * TEST SPEC: AC1 + AC9 — Detail fields render on success
 *
 * describe('ClienteDetailPanel — Success state', () => {
 *   test('should render Nombre, NIT/RUC, Teléfono, Ciudad when data is available', async () => {
 *     // GIVEN: MSW returns a full cliente object
 *     server.use(
 *       http.get('/api/v1/clientes/:id', () =>
 *         HttpResponse.json({
 *           id: 'alpha-id',
 *           nombre: 'Empresa Alpha SA',
 *           nit: '900123456',
 *           telefono: '3001234567',
 *           ciudad: 'Bogotá',
 *           createdAt: '2026-01-01T00:00:00Z',
 *           updatedAt: '2026-01-01T00:00:00Z',
 *         })
 *       )
 *     );
 *
 *     // WHEN: ClienteDetailPanel renders and data loads
 *     render(<ClienteDetailPanel clienteId="alpha-id" />, { wrapper });
 *     await waitForElementToBeRemoved(() => document.querySelector('.react-loading-skeleton'));
 *
 *     // THEN: All fields are displayed
 *     expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Empresa Alpha SA');
 *     expect(screen.getByTestId('cliente-detail-nit')).toHaveTextContent('900123456');
 *     expect(screen.getByTestId('cliente-detail-telefono')).toHaveTextContent('3001234567');
 *     expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent('Bogotá');
 *   });
 *
 *   test('should render "—" for null Teléfono field', async () => {
 *     // GIVEN: MSW returns a client with null telefono
 *     server.use(
 *       http.get('/api/v1/clientes/:id', () =>
 *         HttpResponse.json({ id: 'beta-id', nombre: 'Beta SAS', nit: '800222', telefono: null, ciudad: null, ... })
 *       )
 *     );
 *
 *     render(<ClienteDetailPanel clienteId="beta-id" />, { wrapper });
 *     await waitForElementToBeRemoved(() => document.querySelector('.react-loading-skeleton'));
 *
 *     // THEN: "—" shown for null telefono
 *     expect(screen.getByTestId('cliente-detail-telefono')).toHaveTextContent('—');
 *   });
 *
 *   test('should render "—" for null Ciudad field', async () => {
 *     // GIVEN: Same null-ciudad client fixture
 *     // THEN: "—" shown for null ciudad
 *     expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent('—');
 *   });
 *
 *   test('should render the client Nombre as an h2 heading (AC9 accessibility)', async () => {
 *     // GIVEN: Data is loaded
 *     // THEN: <h2> heading contains the client Nombre
 *     expect(screen.getByRole('heading', { level: 2, name: 'Empresa Alpha SA' })).toBeInTheDocument();
 *   });
 *
 *   test('should use a <dl> definition list for key-value fields (AC9 semantic structure)', async () => {
 *     // GIVEN: Data is loaded
 *     // THEN: A <dl> element wraps the field definitions
 *     const dl = screen.getByRole('definition').closest('dl');
 *     expect(dl).toBeInTheDocument();
 *   });
 * });
 */

// ─────────────────────────────────────────────────────────────────────────────
// SPECIFICATION: useCliente Hook Tests (Vitest + MSW)
//
// File to create: frontend/src/modules/crm/clientes/application/useCliente.test.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * describe('useCliente — TanStack Query hook', () => {
 *   test('should return a Cliente object on successful fetch', async () => {
 *     // GIVEN: MSW returns a full cliente object for GET /api/v1/clientes/:id
 *     // WHEN: useCliente('alpha-id') is called
 *     // THEN: data matches the mocked cliente; isLoading is false; isError is false
 *   });
 *
 *   test('should set isError to true and error.response.status to 404 when API returns 404', async () => {
 *     // GIVEN: MSW returns 404 for the endpoint
 *     // WHEN: useCliente('nonexistent-id') is called
 *     // THEN: isError === true; (error as any).response?.status === 404
 *   });
 *
 *   test('should set isError to true with non-404 status on server error (500)', async () => {
 *     // GIVEN: MSW returns 500 for the endpoint
 *     // WHEN: useCliente('some-id') is called
 *     // THEN: isError === true; error status !== 404
 *   });
 *
 *   test('should NOT execute the query (enabled: false) when id is undefined', async () => {
 *     // GIVEN: useCliente(undefined) is called
 *     // WHEN: hook renders
 *     // THEN: isLoading is false; data is undefined; no API call was made
 *   });
 *
 *   test('should NOT retry the query when the error status is 404 (no-retry on not-found)', async () => {
 *     // GIVEN: MSW always returns 404 for the endpoint
 *     // WHEN: useCliente('nonexistent-id') is called with retry behavior
 *     // THEN: The API is called exactly once (no retries for 404)
 *   });
 * });
 */

// This file is a RED-phase specification. The actual Vitest+RTL tests must be
// implemented in the frontend/ directory as described above.
export {};
